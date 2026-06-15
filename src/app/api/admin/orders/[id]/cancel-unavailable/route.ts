import { NextRequest, NextResponse } from 'next/server';
import { withAuth, prisma } from '@/lib';
import { sendEmail } from '@/lib/email/nodemailer';
import { generateOrderStatusEmail } from '@/lib/email/templates/order-status';

// POST - Admin cancels a special order that can't be sourced.
// Status AWAITING_ADMIN_CONFIRMATION → CANCELLED_UNAVAILABLE. No charge is made.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, authUser) => {
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
      const body = await req.json().catch(() => ({}));
      const reason: string | null =
        typeof body.reason === 'string' && body.reason.trim() !== ''
          ? body.reason.trim()
          : null;

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

      await prisma.orders.update({
        where: { id },
        data: {
          status: 'CANCELLED_UNAVAILABLE',
          cancellation_reason: reason,
        },
      });

      // Notify the customer of the cancellation (with the reason, if given).
      try {
        const { html, text } = generateOrderStatusEmail({
          orderNumber: order.order_number,
          customerName: `${order.user.first_name} ${order.user.last_name}`,
          changedField: 'status',
          newStatus: 'CANCELLED_UNAVAILABLE',
          invoiceUrl: null,
          note: reason,
        });
        await sendEmail({
          to: order.user.email,
          subject: `DentalMall - Order ${order.order_number} Cancelled`,
          html,
          text,
        });
      } catch (emailError) {
        console.error('Failed to send cancellation email:', emailError);
      }

      // Audit log
      await prisma.admin_action_logs.create({
        data: {
          admin_id: adminUser.id,
          target_user_id: order.user_id,
          action: 'SPECIAL_ORDER_CANCELLED',
          details: `Cancelled order ${order.order_number} as unavailable${reason ? ` — reason: ${reason}` : ''}`,
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
      console.error('Error cancelling order:', error);
      return NextResponse.json(
        { error: 'Failed to cancel order' },
        { status: 500 }
      );
    }
  });
}
