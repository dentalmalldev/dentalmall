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
      const status = searchParams.get('status');
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
        return NextResponse.json([]);
      }

      const whereClause: Record<string, unknown> = {
        items: {
          some: {
            product: {
              vendor_id: { in: vendorIds },
            },
          },
        },
      };

      if (status) {
        whereClause.status = status;
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
            where: {
              product: { vendor_id: { in: vendorIds } },
            },
            include: {
              product: {
                include: { media: true },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return NextResponse.json(orders);
    } catch (error) {
      console.error('Error fetching vendor orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }
  });
}
