import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';

// GET - Get vendors (public listing or user's own vendors)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const isPublic = searchParams.get('public') === 'true';

  // Public listing of all active vendors
  if (isPublic) {
    try {
      const vendors = await prisma.vendors.findMany({
        where: { is_active: true },
        select: {
          id: true,
          company_name: true,
          description: true,
          city: true,
          email: true,
          _count: { select: { products: true } },
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
  }

  // Authenticated: get user's own vendors
  return withAuth(request, async (req, authUser) => {
    try {
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const vendors = await prisma.vendors.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
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
