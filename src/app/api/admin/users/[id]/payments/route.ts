import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (_req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    const orders = await prisma.orders.findMany({
      where: { user_id: id },
      select: {
        id: true,
        order_number: true,
        total: true,
        payment_status: true,
        payment_method: true,
        invoice_url: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const totalPaid = orders
      .filter((o) => o.payment_status === 'PAID' || o.payment_status === 'REFUNDED')
      .reduce((sum, o) => sum + parseFloat(String(o.total)), 0);

    const failedCount = orders.filter((o) => o.payment_status === 'FAILED').length;

    const byMethod: Record<string, number> = {};
    for (const o of orders) {
      byMethod[o.payment_method] = (byMethod[o.payment_method] || 0) + 1;
    }

    return NextResponse.json({ orders, totalPaid, failedCount, byMethod });
  });
}
