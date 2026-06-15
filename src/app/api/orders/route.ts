import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
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

// Reserve a unique order number, avoiding both DB collisions and any already
// reserved within this request (so a split order pair can't collide with itself).
async function reserveOrderNumber(reserved: Set<string>): Promise<string> {
  let orderNumber = generateOrderNumber();
  let attempts = 0;
  while (attempts < 10) {
    if (!reserved.has(orderNumber)) {
      const existing = await prisma.orders.findUnique({ where: { order_number: orderNumber } });
      if (!existing) break;
    }
    orderNumber = generateOrderNumber();
    attempts++;
  }
  reserved.add(orderNumber);
  return orderNumber;
}

type CartItemWithRelations = Prisma.cart_itemsGetPayload<{
  include: { product: true; variant_option: true };
}>;

// Build order_items rows + monetary totals for one group of cart items.
function buildOrderLines(cartItems: CartItemWithRelations[]) {
  let subtotal = 0;
  let discount = 0;

  const orderItems = cartItems.map((item) => {
    const source = item.variant_option || item.product;
    // For variant options the customer-facing original is dentalmall_price; product stays price.
    const originalPrice = item.variant_option
      ? parseFloat(item.variant_option.dentalmall_price.toString())
      : parseFloat(item.product.price.toString());
    const price = source.sale_price ? parseFloat(source.sale_price.toString()) : originalPrice;

    subtotal += originalPrice * item.quantity;
    discount += (originalPrice - price) * item.quantity;

    return {
      product_id: item.product_id,
      variant_option_id: item.variant_option_id || null,
      variant_name: item.variant_option ? item.variant_option.name : null,
      quantity: item.quantity,
      price,
    };
  });

  return { orderItems, subtotal, discount, total: subtotal - discount };
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
          variant_option: true,
        },
      });

      if (cartItems.length === 0) {
        return NextResponse.json(
          { error: 'Cart is empty' },
          { status: 400 }
        );
      }

      // Split the cart by fulfilment type. In-storage items follow the normal
      // flow (PENDING → accountant). Special-order items park in
      // AWAITING_ADMIN_CONFIRMATION until an admin confirms they can be sourced,
      // and are hidden from the accountant queue until then.
      const inStorageItems = cartItems.filter(
        (i) => i.product.in_storage_stock
      ) as CartItemWithRelations[];
      const specialOrderItems = cartItems.filter(
        (i) => !i.product.in_storage_stock
      ) as CartItemWithRelations[];

      const split = inStorageItems.length > 0 && specialOrderItems.length > 0;
      // Sibling orders share a group id; single (non-split) orders get null.
      const orderGroupId = split ? randomUUID() : null;

      interface OrderSpec {
        type: 'in_stock' | 'special_order';
        items: CartItemWithRelations[];
        status: 'PENDING' | 'AWAITING_ADMIN_CONFIRMATION';
        payment_status: 'INVOICE_SENT' | 'PENDING';
      }

      const specs: OrderSpec[] = [];
      if (inStorageItems.length > 0) {
        specs.push({
          type: 'in_stock',
          items: inStorageItems,
          status: 'PENDING',
          payment_status: payment_method === 'INVOICE' ? 'INVOICE_SENT' : 'PENDING',
        });
      }
      if (specialOrderItems.length > 0) {
        specs.push({
          type: 'special_order',
          items: specialOrderItems,
          // Not invoiced yet — charged after the admin confirms availability.
          status: 'AWAITING_ADMIN_CONFIRMATION',
          payment_status: 'PENDING',
        });
      }

      // Reserve order numbers up-front so a failure mid-transaction can't leave gaps.
      const reserved = new Set<string>();
      const plan: { spec: OrderSpec; orderNumber: string }[] = [];
      for (const spec of specs) {
        plan.push({ spec, orderNumber: await reserveOrderNumber(reserved) });
      }

      const orderInclude = {
        address: true,
        items: {
          include: { product: { include: { media: true } } },
        },
      } satisfies Prisma.ordersInclude;
      type CreatedOrder = Prisma.ordersGetPayload<{ include: typeof orderInclude }>;

      // Single transaction: create all orders + clear cart together. If creating
      // the second order throws, the first is rolled back.
      const createdOrders = await prisma.$transaction(async (tx) => {
        const results: { type: OrderSpec['type']; order: CreatedOrder }[] = [];
        for (const { spec, orderNumber } of plan) {
          const { orderItems, subtotal, discount, total } = buildOrderLines(spec.items);
          const created = await tx.orders.create({
            data: {
              order_number: orderNumber,
              order_group_id: orderGroupId,
              user_id: user.id,
              address_id: address_id,
              status: spec.status,
              payment_method: payment_method,
              payment_status: spec.payment_status,
              subtotal,
              discount,
              delivery_fee: 0,
              total,
              notes: notes || null,
              items: { create: orderItems },
            },
            include: orderInclude,
          });
          results.push({ type: spec.type, order: created });
        }

        await tx.cart_items.deleteMany({ where: { user_id: user.id } });
        return results;
      });

      // Invoices are only generated for the in-stock (normally-invoiced) order.
      // Special orders are invoiced later, after admin confirmation.
      const invoiceUrlByOrderId: Record<string, string | null> = {};
      for (const { type, order } of createdOrders) {
        if (type === 'special_order') continue;

        const invoiceData: InvoiceData = {
          orderNumber: order.order_number,
          customerName: `${user.first_name} ${user.last_name}`,
          customerEmail: user.email,
          address: {
            recipient_name: order.address.recipient_name,
            mobile_number: order.address.mobile_number,
            city: order.address.city,
            address: order.address.address,
            postal_code: order.address.postal_code,
          },
          items: order.items.map((item) => ({
            name: item.product.name,
            variantName: item.variant_name || undefined,
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

        // Generate and upload invoice PDF (non-blocking)
        let invoiceUrl: string | null = null;
        try {
          const pdfBuffer = await generateInvoicePDF(invoiceData);
          const pdfFilename = `invoices/invoice-${order.order_number}.pdf`;
          invoiceUrl = await uploadToStorage(pdfBuffer, pdfFilename, 'application/pdf');
          await prisma.orders.update({
            where: { id: order.id },
            data: { invoice_url: invoiceUrl },
          });
        } catch (pdfError) {
          console.error('Failed to generate/upload invoice PDF:', pdfError);
        }
        invoiceUrlByOrderId[order.id] = invoiceUrl;

        // Send invoice email regardless of PDF success
        try {
          const { html, text } = generateInvoiceEmail(invoiceData, invoiceUrl ?? undefined);
          await sendEmail({
            to: user.email,
            subject: `DentalMall - Invoice ${order.order_number}`,
            html,
            text,
          });
        } catch (emailError) {
          console.error('Failed to send invoice email:', emailError);
        }
      }

      const ordersPayload = createdOrders.map(({ type, order }) => ({
        id: order.id,
        order_number: order.order_number,
        type,
        status: order.status,
        total: parseFloat(order.total.toString()),
        item_count: order.items.length,
        invoice_url: invoiceUrlByOrderId[order.id] ?? null,
      }));

      // The primary order (used for the single-order legacy fields) is the
      // in-stock one when present, otherwise the special order.
      const primary = ordersPayload[0];

      return NextResponse.json(
        {
          split,
          order_group_id: orderGroupId,
          orders: ordersPayload,
          // Backwards-compatible single-order fields:
          order_number: primary.order_number,
          id: primary.id,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creating order:', error);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }
  });
}
