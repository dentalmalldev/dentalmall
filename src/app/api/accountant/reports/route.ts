import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    const user = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!user || user.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '30'; // days
    const days = parseInt(range);
    const from = new Date();
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);

    const [
      allOrders,
      byPaymentMethod,
      byPaymentStatus,
      byOrderStatus,
      dailyRevenue,
    ] = await Promise.all([
      // Overall totals
      prisma.orders.aggregate({
        where: { created_at: { gte: from } },
        _sum: { total: true, subtotal: true, discount: true, delivery_fee: true },
        _count: { id: true },
      }),

      // By payment method
      prisma.orders.groupBy({
        by: ['payment_method'],
        where: { created_at: { gte: from } },
        _count: { id: true },
        _sum: { total: true },
      }),

      // By payment status
      prisma.orders.groupBy({
        by: ['payment_status'],
        where: { created_at: { gte: from } },
        _count: { id: true },
        _sum: { total: true },
      }),

      // By order status
      prisma.orders.groupBy({
        by: ['status'],
        where: { created_at: { gte: from } },
        _count: { id: true },
      }),

      // Daily revenue for chart (paid orders only)
      prisma.$queryRaw<{ day: Date; revenue: number; count: bigint }[]>`
        SELECT
          DATE_TRUNC('day', created_at) as day,
          SUM(total::numeric) as revenue,
          COUNT(id) as count
        FROM orders
        WHERE created_at >= ${from}
          AND payment_status = 'PAID'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY day ASC
      `,
    ]);

    return NextResponse.json({
      summary: {
        total_orders: allOrders._count.id,
        total_revenue: parseFloat(String(allOrders._sum.total ?? 0)),
        total_subtotal: parseFloat(String(allOrders._sum.subtotal ?? 0)),
        total_discount: parseFloat(String(allOrders._sum.discount ?? 0)),
        total_delivery: parseFloat(String(allOrders._sum.delivery_fee ?? 0)),
      },
      by_payment_method: byPaymentMethod.map((r) => ({
        method: r.payment_method,
        count: r._count.id,
        total: parseFloat(String(r._sum.total ?? 0)),
      })),
      by_payment_status: byPaymentStatus.map((r) => ({
        status: r.payment_status,
        count: r._count.id,
        total: parseFloat(String(r._sum.total ?? 0)),
      })),
      by_order_status: byOrderStatus.map((r) => ({
        status: r.status,
        count: r._count.id,
      })),
      daily_revenue: dailyRevenue.map((r) => ({
        day: r.day,
        revenue: parseFloat(String(r.revenue)),
        count: Number(r.count),
      })),
    });
  });
}
