import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { withAuth, prisma } from '@/lib';
import { uploadToStorage } from '@/lib/firebase-admin';
import { sendEmail } from '@/lib/email/nodemailer';
import { generateInvoiceEmail } from '@/lib/email/templates/invoice';
import { generateInvoicePDF } from '@/lib/email/templates/invoice-pdf';
import { calculateDeliveryFee } from '@/lib/pricing/calculateDeliveryFee';
import { stripCostPrices } from '@/lib/products/publicPricing';
import { decrementStock, InsufficientStockError } from '@/lib/orders/stock';
import { STOCK_LIMITS_ENABLED } from '@/lib/stock-policy';
import { recordCreditUse, takeCreditForOrder } from '@/lib/credit/ledger.server';
import { amountToPay, cartQualifiesForCredit, tetriToDecimal, toTetri } from '@/lib/credit/money';
import { buildInvoiceData } from '@/lib/invoice/generateInvoice';

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
    // Selling price lives in `price` on both products and options.
    const originalPrice = parseFloat(source.price.toString());
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

  // Delivery fee is based on the product total the customer actually pays.
  const productTotal = subtotal - discount;
  const deliveryFee = calculateDeliveryFee(productTotal);

  return { orderItems, subtotal, discount, deliveryFee, total: productTotal + deliveryFee };
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

      return NextResponse.json(stripCostPrices(orders));
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
      const plan: { spec: OrderSpec; orderNumber: string; lines: ReturnType<typeof buildOrderLines> }[] = [];
      for (const spec of specs) {
        plan.push({ spec, orderNumber: await reserveOrderNumber(reserved), lines: buildOrderLines(spec.items) });
      }

      // Credit needs the whole cart (all orders, products plus delivery) to
      // reach the minimum; the cart and checkout preview apply the same rule.
      const cartTotal = plan.reduce((sum, p) => sum + p.lines.total, 0);
      const useCredit = toTetri(user.credit_balance) > 0 && cartQualifiesForCredit(cartTotal);

      const orderInclude = {
        address: true,
        items: {
          include: { product: { include: { media: true } } },
        },
      } satisfies Prisma.ordersInclude;
      type CreatedOrder = Prisma.ordersGetPayload<{ include: typeof orderInclude }>;

      // Single transaction: take stock and credit, create all orders and clear
      // the cart together. If anything throws — a short item, or creating the
      // second order — every stock change, the credit and the first order are
      // rolled back.
      const createdOrders = await prisma.$transaction(async (tx) => {
        const results: { type: OrderSpec['type']; order: CreatedOrder }[] = [];
        for (const [index, { spec, orderNumber, lines }] of plan.entries()) {
          // Only warehouse stock is ours to count. Special-order items sit at
          // the vendor, so their stock figure is informational and left alone.
          // While stock limits are off, no order touches stock at all.
          const takesStock = STOCK_LIMITS_ENABLED && spec.type === 'in_stock';
          if (takesStock) await decrementStock(tx, spec.items);

          const { orderItems, subtotal, discount, deliveryFee, total } = lines;

          // Store credit goes to the first order of the checkout only (the
          // in-stock one when there is one), as much of its total as the balance
          // covers. The user row stays locked until commit, so a concurrent
          // checkout waits and then sees what's left. Customers with no balance
          // when the request started, or whose cart is under the credit minimum,
          // skip this entirely (never over-spends: credit added meanwhile is
          // simply used next time).
          const credit =
            index === 0 && useCredit
              ? await takeCreditForOrder(tx, user.id, total)
              : { takenTetri: 0, balanceAfterTetri: 0 };

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
              delivery_fee: deliveryFee,
              service_fee: 0,
              total,
              credit_applied: tetriToDecimal(credit.takenTetri),
              notes: notes || null,
              stock_decremented: takesStock,
              items: { create: orderItems },
            },
            include: orderInclude,
          });
          await recordCreditUse(tx, { userId: user.id, orderId: created.id, ...credit });
          results.push({ type: spec.type, order: created });
        }

        await tx.cart_items.deleteMany({ where: { user_id: user.id } });
        return results;
      });

      // Generate + email an invoice for every order at checkout (in-stock and
      // special-order alike). Special orders may receive a second, updated
      // invoice later when an admin confirms availability.
      const invoiceUrlByOrderId: Record<string, string | null> = {};
      for (const { order } of createdOrders) {
        // Same builder as admin regeneration, so both invoices carry the credit line.
        const invoiceData = buildInvoiceData({ ...order, user });

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
          console.error(`Failed to generate/upload invoice PDF for order ${order.order_number}:`, pdfError);
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
        credit_applied: parseFloat(order.credit_applied.toString()),
        amount_to_pay: amountToPay(order.total, order.credit_applied),
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
          orders: stripCostPrices(ordersPayload),
          // Backwards-compatible single-order fields:
          order_number: primary.order_number,
          id: primary.id,
        },
        { status: 201 }
      );
    } catch (error) {
      if (error instanceof InsufficientStockError) {
        return NextResponse.json(
          { error: error.message, code: 'INSUFFICIENT_STOCK', item: error.item },
          { status: 409 }
        );
      }
      console.error('Error creating order:', error);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }
  });
}
