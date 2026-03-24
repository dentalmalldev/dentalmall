import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';
import { sendEmail } from '@/lib/email/nodemailer';
import { logAdminAction } from '@/lib/admin-log';

// POST /api/admin/users/[id]/refund
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { order_id, type, amount, reason, admin_notes } = body;

    if (!order_id || !type || !reason) {
      return NextResponse.json({ error: 'order_id, type, and reason are required' }, { status: 400 });
    }

    const order = await prisma.orders.findFirst({
      where: { id: order_id, user_id: id },
      include: { user: { select: { email: true, first_name: true, last_name: true } } },
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.payment_status !== 'PAID') {
      return NextResponse.json({ error: 'Can only refund PAID orders' }, { status: 400 });
    }

    // Check no existing refund
    const existingRefund = await prisma.refunds.findUnique({ where: { order_id } });
    if (existingRefund) {
      return NextResponse.json({ error: 'Order has already been refunded' }, { status: 400 });
    }

    const orderTotal = parseFloat(String(order.total));
    const refundAmount = type === 'FULL' ? orderTotal : parseFloat(String(amount));

    if (isNaN(refundAmount) || refundAmount <= 0) {
      return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 });
    }
    if (refundAmount > orderTotal) {
      return NextResponse.json({ error: 'Refund cannot exceed order total' }, { status: 400 });
    }

    // Create refund record and update payment status
    const [refund] = await prisma.$transaction([
      prisma.refunds.create({
        data: {
          order_id,
          admin_id: admin.id,
          amount: refundAmount,
          type,
          reason,
          admin_notes: admin_notes || null,
        },
      }),
      prisma.orders.update({
        where: { id: order_id },
        data: { payment_status: 'REFUNDED' },
      }),
    ]);

    await logAdminAction(
      admin.id,
      'REFUND_ISSUED',
      id,
      `Order ${order.order_number} — ₾${refundAmount.toFixed(2)} (${type}) — ${reason}`
    );

    // Send refund confirmation email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #5B6ECD; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">DentalMall — Refund Confirmation</h1>
        </div>
        <div style="border: 1px solid #e0e0e0; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="color: #333;">Dear ${order.user.first_name} ${order.user.last_name},</p>
          <p style="color: #333;">Your refund for order <strong>${order.order_number}</strong> has been processed.</p>
          <div style="background: #f5f6fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Refund Amount:</strong> ₾${refundAmount.toFixed(2)}</p>
            <p style="margin: 4px 0;"><strong>Type:</strong> ${type} Refund</p>
            <p style="margin: 4px 0;"><strong>Reason:</strong> ${reason}</p>
          </div>
          <p style="color: #666;">Please allow 5-10 business days for the refund to appear on your account.</p>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">DentalMall Team</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: order.user.email,
      subject: `Refund Confirmation — ${order.order_number}`,
      html,
      text: `Your refund of ₾${refundAmount.toFixed(2)} for order ${order.order_number} has been processed.`,
    });

    return NextResponse.json(refund, { status: 201 });
  });
}
