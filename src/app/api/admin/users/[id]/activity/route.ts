import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (_req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    // Derive activity from orders + admin action logs
    const [orders, adminActions] = await Promise.all([
      prisma.orders.findMany({
        where: { user_id: id },
        select: { id: true, order_number: true, total: true, status: true, created_at: true },
        orderBy: { created_at: 'desc' },
        take: 100,
      }),
      prisma.admin_action_logs.findMany({
        where: { target_user_id: id },
        orderBy: { created_at: 'desc' },
        take: 100,
      }),
    ]);

    const events: { id: string; type: string; label: string; details: string; created_at: Date }[] = [];

    for (const o of orders) {
      events.push({
        id: `order-${o.id}`,
        type: 'ORDER_PLACED',
        label: `Order Placed`,
        details: `${o.order_number} — ₾${parseFloat(String(o.total)).toFixed(2)} (${o.status})`,
        created_at: o.created_at,
      });
    }

    for (const a of adminActions) {
      events.push({
        id: `admin-${a.id}`,
        type: a.action,
        label: a.action.replace(/_/g, ' '),
        details: a.details || '',
        created_at: a.created_at,
      });
    }

    events.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

    return NextResponse.json(events.slice(0, 200));
  });
}
