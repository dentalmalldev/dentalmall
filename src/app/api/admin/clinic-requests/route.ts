import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';


// GET - Get all clinic requests (admin only)
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
      const status = searchParams.get('status');

      const whereClause = status ? { status: status as any } : {};

      const requests = await prisma.clinic_requests.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              role: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return NextResponse.json(requests);
    } catch (error) {
      console.error('Error fetching clinic requests:', error);
      return NextResponse.json(
        { error: 'Failed to fetch clinic requests' },
        { status: 500 }
      );
    }
  });
}
