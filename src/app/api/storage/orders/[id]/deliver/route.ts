import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';
import { sendEmail } from '@/lib/email/nodemailer';
import { generateOrderStatusEmail } from '@/lib/email/templates/order-status';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, authUser) => {
    const storageUser = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!storageUser || storageUser.role !== 'STORAGE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { warehouse_notes } = body;

    const order = await prisma.orders.findUnique({
      where: { id },
      include: { user: true },
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'OUT_FOR_DELIVERY') {
      return NextResponse.json(
        { error: `Order must be in OUT_FOR_DELIVERY status, currently: ${order.status}` },
        { status: 400 }
      );
    }

    const updated = await prisma.orders.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        delivered_at: new Date(),
        warehouse_notes: warehouse_notes || order.warehouse_notes,
      },
    });

    // Send status update email
    try {
      const { html, text } = generateOrderStatusEmail({
        orderNumber: order.order_number,
        customerName: `${order.user.first_name} ${order.user.last_name}`,
        changedField: 'status',
        newStatus: 'DELIVERED',
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

    return NextResponse.json(updated);
  });
}
