import { NextRequest, NextResponse } from 'next/server';
import { withAuth, prisma } from '@/lib';
import { OrderStatus } from '@prisma/client';

// The three lifecycle states a special order can be in for admin review.
const SPECIAL_STATUSES: OrderStatus[] = [
  'AWAITING_ADMIN_CONFIRMATION',
  'CONFIRMED_PENDING_PAYMENT',
  'CANCELLED_UNAVAILABLE',
];

// GET - Special orders for the admin confirmation queue.
// Returns lifecycle counts always, and the order list unless `counts_only=true`
// (the nav badge uses counts_only to stay cheap).
export async function GET(request: NextRequest) {
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

      const { searchParams } = new URL(req.url);
      const countsOnly = searchParams.get('counts_only') === 'true';

      const [pending, confirmed, cancelled] = await Promise.all([
        prisma.orders.count({ where: { status: 'AWAITING_ADMIN_CONFIRMATION' } }),
        prisma.orders.count({ where: { status: 'CONFIRMED_PENDING_PAYMENT' } }),
        prisma.orders.count({ where: { status: 'CANCELLED_UNAVAILABLE' } }),
      ]);
      const counts = { pending, confirmed, cancelled };

      if (countsOnly) {
        return NextResponse.json({ counts });
      }

      const statusParam = searchParams.get('status') as OrderStatus | null;
      const status: OrderStatus =
        statusParam && SPECIAL_STATUSES.includes(statusParam)
          ? statusParam
          : 'AWAITING_ADMIN_CONFIRMATION';

      const data = await prisma.orders.findMany({
        where: { status },
        include: {
          user: { select: { id: true, email: true, first_name: true, last_name: true } },
          address: true,
          items: {
            include: {
              product: {
                include: {
                  media: { take: 1 },
                  vendor: { select: { id: true, company_name: true } },
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return NextResponse.json({ data, counts });
    } catch (error) {
      console.error('Error fetching special orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch special orders' },
        { status: 500 }
      );
    }
  });
}
