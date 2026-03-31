import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, authUser) => {
    const accountant = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!accountant || accountant.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { payment_notes } = body;

    const order = await prisma.orders.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only invoice orders in INVOICE_SENT status can be verified
    if (order.payment_method !== 'INVOICE') {
      return NextResponse.json(
        { error: 'Only invoice payments can be manually verified' },
        { status: 400 }
      );
    }

    if (order.payment_status !== 'INVOICE_SENT' && order.payment_status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Order payment has already been processed' },
        { status: 400 }
      );
    }

    const updated = await prisma.orders.update({
      where: { id },
      data: {
        payment_status: 'PAID',
        status: 'PROCESSING',
        payment_verified_by: accountant.id,
        payment_verified_at: new Date(),
        payment_notes: payment_notes || null,
      },
      include: {
        user: { select: { id: true, email: true, first_name: true, last_name: true } },
        address: true,
        items: {
          include: {
            product: { include: { media: { take: 1 } } },
            variant_option: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  });
}
