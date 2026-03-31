import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';

export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, authUser) => {
    const user = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!user || user.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayPaid, pendingInvoices, monthRevenue, failedPayments, cardToday, invoiceToday] =
      await Promise.all([
        // Paid today (all methods)
        prisma.orders.count({
          where: { payment_status: 'PAID', payment_verified_at: { gte: todayStart } },
        }),

        // Pending invoices (INVOICE_SENT or PENDING with INVOICE method)
        prisma.orders.count({
          where: {
            payment_method: 'INVOICE',
            payment_status: { in: ['INVOICE_SENT', 'PENDING'] },
          },
        }),

        // This month revenue (paid orders)
        prisma.orders.aggregate({
          where: { payment_status: 'PAID', updated_at: { gte: monthStart } },
          _sum: { total: true },
        }),

        // Failed payments
        prisma.orders.count({ where: { payment_status: 'FAILED' } }),

        // Card payments today
        prisma.orders.count({
          where: { payment_method: 'CARD', created_at: { gte: todayStart } },
        }),

        // Invoice payments today
        prisma.orders.count({
          where: { payment_method: 'INVOICE', created_at: { gte: todayStart } },
        }),
      ]);

    return NextResponse.json({
      today_paid: todayPaid,
      pending_invoices: pendingInvoices,
      month_revenue: monthRevenue._sum.total ? parseFloat(monthRevenue._sum.total.toString()) : 0,
      failed_payments: failedPayments,
      card_today: cardToday,
      invoice_today: invoiceToday,
    });
  });
}
