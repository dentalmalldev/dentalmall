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
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const search = searchParams.get('search') || '';
      const vendorId = searchParams.get('vendor_id');

      const vendorWhere = vendorId
        ? { id: vendorId, user_id: user.id }
        : { user_id: user.id };

      const vendors = await prisma.vendors.findMany({
        where: vendorWhere,
        select: { id: true },
      });

      const vendorIds = vendors.map((v) => v.id);

      const skip = (page - 1) * limit;

      const whereClause: Record<string, unknown> = {
        vendor_id: { in: vendorIds },
      };

      if (search) {
        whereClause.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { name_ka: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [products, total] = await Promise.all([
        prisma.products.findMany({
          where: whereClause,
          include: {
            category: {
              select: { id: true, name: true, name_ka: true },
            },
            vendor: {
              select: { id: true, company_name: true },
            },
            media: true,
            variants: true,
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
        }),
        prisma.products.count({ where: whereClause }),
      ]);

      return NextResponse.json({
        data: products,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      });
    } catch (error) {
      console.error('Error fetching vendor products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }
  });
}
