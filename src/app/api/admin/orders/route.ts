import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';

// GET - Get all orders (admin only)
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
      const status = searchParams.get('status');
      const paymentStatus = searchParams.get('payment_status');
      // 'in_stock' | 'special' | 'all'. Special orders contain special-order
      // products (in_storage_stock = false); in-stock orders contain none.
      const orderType = searchParams.get('order_type');

      const whereClause: Record<string, unknown> = {};
      if (status) whereClause.status = status;
      if (paymentStatus) whereClause.payment_status = paymentStatus;
      if (orderType === 'special') {
        whereClause.items = { some: { product: { in_storage_stock: false } } };
      } else if (orderType === 'in_stock') {
        whereClause.items = { none: { product: { in_storage_stock: false } } };
      }

      const orders = await prisma.orders.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
          address: true,
          items: {
            include: {
              product: {
                include: {
                  media: true,
                  vendor: { select: { id: true, company_name: true } },
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return NextResponse.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }
  });
}
