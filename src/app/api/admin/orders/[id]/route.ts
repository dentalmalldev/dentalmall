import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';
import { sendEmail } from '@/lib/email/nodemailer';
import { generateOrderStatusEmail } from '@/lib/email/templates/order-status';

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

      const updateData: Record<string, unknown> = {};
      if (status) updateData.status = status;
      if (payment_status) updateData.payment_status = payment_status;
      if (admin_notes !== undefined) updateData.notes = admin_notes;

      const updatedOrder = await prisma.orders.update({
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
                },
              },
            },
          },
        },
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
