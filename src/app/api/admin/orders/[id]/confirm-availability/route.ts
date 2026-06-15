import { NextRequest, NextResponse } from 'next/server';
import { withAuth, prisma } from '@/lib';
import { sendEmail } from '@/lib/email/nodemailer';
import { generateOrderStatusEmail } from '@/lib/email/templates/order-status';
import { generateAndStoreOrderInvoice } from '@/lib/invoice/generateInvoice';

// POST - Admin confirms a special order can be sourced.
// Status AWAITING_ADMIN_CONFIRMATION → CONFIRMED_PENDING_PAYMENT, issues a second
// invoice, notifies the customer, and lets the order enter the accountant queue.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const adminUser = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        );
      }

      const { id } = await params;

      const order = await prisma.orders.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      if (order.status !== 'AWAITING_ADMIN_CONFIRMATION') {
        return NextResponse.json(
          { error: 'Order is not awaiting admin confirmation' },
          { status: 400 }
        );
      }

      // Move into the payment-verification flow. Invoice orders are marked
      // INVOICE_SENT (mirrors the in-stock flow); card orders stay PENDING.
      const newPaymentStatus = order.payment_method === 'INVOICE' ? 'INVOICE_SENT' : 'PENDING';

      await prisma.orders.update({
        where: { id },
        data: {
          status: 'CONFIRMED_PENDING_PAYMENT',
          payment_status: newPaymentStatus,
        },
      });

      // Generate + store the second invoice (reuses the standard invoice format).
      const invoiceUrl = await generateAndStoreOrderInvoice(order.id);

      // Notify the customer with the new invoice link.
      try {
        const { html, text } = generateOrderStatusEmail({
          orderNumber: order.order_number,
          customerName: `${order.user.first_name} ${order.user.last_name}`,
          changedField: 'status',
          newStatus: 'CONFIRMED_PENDING_PAYMENT',
          invoiceUrl,
        });
        await sendEmail({
          to: order.user.email,
          subject: `DentalMall - Order ${order.order_number} Confirmed`,
          html,
          text,
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      // Audit log
      await prisma.admin_action_logs.create({
        data: {
          admin_id: adminUser.id,
          target_user_id: order.user_id,
          action: 'SPECIAL_ORDER_CONFIRMED',
          details: `Confirmed availability for order ${order.order_number}`,
        },
      });

      const updatedOrder = await prisma.orders.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, email: true, first_name: true, last_name: true } },
          address: true,
          items: { include: { product: { include: { media: true } } } },
        },
      });

      return NextResponse.json(updatedOrder);
    } catch (error) {
      console.error('Error confirming order availability:', error);
      return NextResponse.json(
        { error: 'Failed to confirm order availability' },
        { status: 500 }
      );
    }
  });
}
