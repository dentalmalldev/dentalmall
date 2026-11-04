import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';
import { sendEmail } from '@/lib/email/nodemailer';
import { generateOrderStatusEmail } from '@/lib/email/templates/order-status';
import { CANCELLED_STATUSES, restoreStock } from '@/lib/orders/stock';

// PATCH - Update order status (admin only)
export async function PATCH(
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
      const body = await req.json();
      const { status, payment_status, admin_notes } = body;

      const order = await prisma.orders.findUnique({
        where: { id },
        include: {
          user: true,
          address: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        );
      }

      // Cancelling returns the order's stock, so reopening it would ship goods
      // that are back on sale. The customer has to order again instead.
      if (
        status &&
        CANCELLED_STATUSES.includes(order.status) &&
        !CANCELLED_STATUSES.includes(status)
      ) {
        return NextResponse.json(
          { error: 'A cancelled order cannot be reopened. The customer needs to place a new order.' },
          { status: 400 }
        );
      }

      const updateData: Record<string, unknown> = {};
      if (status) updateData.status = status;
      if (payment_status) updateData.payment_status = payment_status;
      if (admin_notes !== undefined) updateData.notes = admin_notes;

      const updatedOrder = await prisma.$transaction(async (tx) => {
        if (status && CANCELLED_STATUSES.includes(status)) await restoreStock(tx, id);

        return tx.orders.update({
          where: { id },
          data: updateData,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                first_name: true,
                last_name: true,
              },
            },
            address: true,
            items: {
              include: {
                product: {
                  include: {
                    media: true,
                    vendor: { select: { id: true, company_name: true, phone_number: true } },
                  },
                },
              },
            },
          },
        });
      });

      // Send notification email to user
      try {
        const changedField = status ? 'status' : 'payment_status';
        const newValue = status || payment_status;

        const { html, text } = generateOrderStatusEmail({
          orderNumber: order.order_number,
          customerName: `${order.user.first_name} ${order.user.last_name}`,
          changedField,
          newStatus: newValue,
          invoiceUrl: order.invoice_url,
        });

        await sendEmail({
          to: order.user.email,
          subject: `DentalMall - Order ${order.order_number} Update`,
          html,
          text,
        });
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }

      return NextResponse.json(updatedOrder);
    } catch (error) {
      console.error('Error updating order:', error);
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      );
    }
  });
}
