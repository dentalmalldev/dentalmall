import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (_req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    // Get order IDs for this user, then fetch refunds
    const userOrders = await prisma.orders.findMany({
      where: { user_id: id },
      select: { id: true, order_number: true, total: true },
    });
    const orderIds = userOrders.map((o) => o.id);

    const refunds = await prisma.refunds.findMany({
      where: { order_id: { in: orderIds } },
      include: { order: { select: { order_number: true, total: true } } },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(refunds);
  });
}
