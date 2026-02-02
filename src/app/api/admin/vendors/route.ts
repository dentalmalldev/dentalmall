import { NextRequest, NextResponse } from 'next/server';
import { withAuth, prisma } from '@/lib';

// GET - Get all active vendors (admin only)
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      // Verify admin role
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
      const activeOnly = searchParams.get('active') !== 'false';

      const whereClause = activeOnly ? { is_active: true } : {};

      const vendors = await prisma.vendors.findMany({
        where: whereClause,
        select: {
          id: true,
          company_name: true,
          identification_number: true,
          email: true,
          city: true,
          is_active: true,
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { company_name: 'asc' },
      });

      return NextResponse.json(vendors);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch vendors' },
        { status: 500 }
      );
    }
  });
}
