import { NextRequest, NextResponse } from 'next/server';
import { withAuth, prisma } from '@/lib';
import { uploadToStorage } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email/nodemailer';
import { generateInvoiceEmail } from '@/lib/email/templates/invoice';
import { generateInvoicePDF } from '@/lib/email/templates/invoice-pdf';
import { InvoiceData } from '@/types/models';

// Generate unique order number like DM-2024-000001
function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const randomPart = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
  return `DM-${year}-${randomPart}`;
}

// GET - Get user's orders
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const orders = await prisma.orders.findMany({
        where: { user_id: user.id },
        include: {
          address: true,
          items: {
            include: {
              product: {
                include: {
                  media: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return NextResponse.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }
  });
}

// POST - Create a new order
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const body = await req.json();
      const { address_id, payment_method = 'INVOICE', notes } = body;

      // Validate address
      const address = await prisma.addresses.findFirst({
        where: { id: address_id, user_id: user.id },
      });

      if (!address) {
        return NextResponse.json(
          { error: 'Invalid address' },
          { status: 400 }
        );
      }

      // Get cart items
      const cartItems = await prisma.cart_items.findMany({
        where: { user_id: user.id },
        include: {
          product: true,
        },
      });

      if (cartItems.length === 0) {
        return NextResponse.json(
          { error: 'Cart is empty' },
          { status: 400 }
        );
      }

      // Calculate totals
      let subtotal = 0;
      let discount = 0;

      const orderItems = cartItems.map((item) => {
        const price = item.product.sale_price
          ? parseFloat(item.product.sale_price.toString())
          : parseFloat(item.product.price.toString());
        const originalPrice = parseFloat(item.product.price.toString());
        const itemTotal = price * item.quantity;
        const itemDiscount = (originalPrice - price) * item.quantity;

        subtotal += originalPrice * item.quantity;
        discount += itemDiscount;

        return {
          product_id: item.product_id,
          quantity: item.quantity,
          price: price,
        };
      });

      const total = subtotal - discount;

      // Generate unique order number
      let orderNumber = generateOrderNumber();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await prisma.orders.findUnique({
          where: { order_number: orderNumber },
        });
        if (!existing) break;
        orderNumber = generateOrderNumber();
        attempts++;
      }

      // Create order with items in a transaction
      const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.orders.create({
          data: {
            order_number: orderNumber,
            user_id: user.id,
            address_id: address_id,
            payment_method: payment_method,
            subtotal: subtotal,
            discount: discount,
            delivery_fee: 0,
            total: total,
            notes: notes || null,
            items: {
              create: orderItems,
            },
          },
          include: {
            address: true,
            items: {
              include: {
                product: {
                  include: {
                    media: true,
                  },
                },
              },
            },
          },
        });

        // Clear cart
        await tx.cart_items.deleteMany({
          where: { user_id: user.id },
        });

        return newOrder;
      });

      // Generate and upload invoice PDF
      let invoiceUrl: string | null = null;
      try {
        const invoiceData: InvoiceData = {
          orderNumber: order.order_number,
          customerName: `${user.first_name} ${user.last_name}`,
          customerEmail: user.email,
          address: {
            city: order.address.city,
            address: order.address.address,
          },
          items: order.items.map((item) => ({
            name: item.product.name,
            quantity: item.quantity,
            price: parseFloat(item.price.toString()),
            total: parseFloat(item.price.toString()) * item.quantity,
          })),
          subtotal: parseFloat(order.subtotal.toString()),
          discount: parseFloat(order.discount.toString()),
          deliveryFee: parseFloat(order.delivery_fee.toString()),
          total: parseFloat(order.total.toString()),
          orderDate: new Date(order.created_at).toLocaleDateString('ka-GE'),
          paymentMethod: order.payment_method,
        };

        // Generate PDF and upload to Firebase Storage
        const pdfBuffer = await generateInvoicePDF(invoiceData);
        const pdfFilename = `invoices/invoice-${order.order_number}.pdf`;
        invoiceUrl = await uploadToStorage(pdfBuffer, pdfFilename, 'application/pdf');

        // Update order with invoice URL
        await prisma.orders.update({
          where: { id: order.id },
          data: { invoice_url: invoiceUrl },
        });

        // Send email with download link
        const { html, text } = generateInvoiceEmail(invoiceData, invoiceUrl);
        await sendEmail({
          to: user.email,
          subject: `DentalMall - Invoice ${order.order_number}`,
          html,
          text,
        });
      } catch (emailError) {
        console.error('Failed to send invoice email:', emailError);
        // Don't fail the order creation if email fails
      }

      return NextResponse.json({ ...order, invoice_url: invoiceUrl }, { status: 201 });
    } catch (error) {
      console.error('Error creating order:', error);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }
  });
}
