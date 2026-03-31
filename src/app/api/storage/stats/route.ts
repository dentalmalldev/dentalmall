import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';

export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, authUser) => {
    const user = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!user || user.role !== 'STORAGE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [processing, ready, outForDelivery, deliveredToday, totalDelivered] = await Promise.all([
      prisma.orders.count({
        where: { payment_status: 'PAID', status: 'PROCESSING' },
      }),
      prisma.orders.count({
        where: { payment_status: 'PAID', status: 'READY_FOR_DELIVERY' },
      }),
      prisma.orders.count({
        where: { payment_status: 'PAID', status: 'OUT_FOR_DELIVERY' },
      }),
      prisma.orders.count({
        where: { status: 'DELIVERED', delivered_at: { gte: todayStart } },
      }),
      prisma.orders.count({
        where: { status: 'DELIVERED' },
      }),
    ]);

    return NextResponse.json({
      processing,
      ready,
      out_for_delivery: outForDelivery,
      delivered_today: deliveredToday,
      total_delivered: totalDelivered,
    });
  });
}
