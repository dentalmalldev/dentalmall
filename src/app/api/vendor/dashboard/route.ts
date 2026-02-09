import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user || user.role !== 'VENDOR') {
        return NextResponse.json(
          { error: 'Access denied. Vendor privileges required.' },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(req.url);
      const vendorId = searchParams.get('vendor_id');

      const vendorWhere = vendorId
        ? { id: vendorId, user_id: user.id }
        : { user_id: user.id };

      const vendors = await prisma.vendors.findMany({
        where: vendorWhere,
        select: { id: true },
      });

      const vendorIds = vendors.map((v) => v.id);

      if (vendorIds.length === 0) {
        return NextResponse.json({
          totalProducts: 0,
          totalOrders: 0,
          totalRevenue: 0,
          outOfStockProducts: 0,
          recentOrders: 0,
        });
      }

      const [totalProducts, outOfStockProducts, orderItems] = await Promise.all([
        prisma.products.count({
          where: { vendor_id: { in: vendorIds } },
        }),
        prisma.products.count({
          where: { vendor_id: { in: vendorIds }, stock: 0 },
        }),
        prisma.order_items.findMany({
          where: { product: { vendor_id: { in: vendorIds } } },
          select: {
            price: true,
            quantity: true,
            order: { select: { id: true, created_at: true } },
          },
        }),
      ]);

      const uniqueOrderIds = new Set(orderItems.map((i) => i.order.id));
      const totalRevenue = orderItems.reduce(
        (sum, item) => sum + parseFloat(item.price.toString()) * item.quantity,
        0
      );

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentOrderIds = new Set(
        orderItems
          .filter((i) => new Date(i.order.created_at) >= thirtyDaysAgo)
          .map((i) => i.order.id)
      );

      return NextResponse.json({
        totalProducts,
        totalOrders: uniqueOrderIds.size,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        outOfStockProducts,
        recentOrders: recentOrderIds.size,
      });
    } catch (error) {
      console.error('Error fetching vendor dashboard:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dashboard stats' },
        { status: 500 }
      );
    }
  });
}
