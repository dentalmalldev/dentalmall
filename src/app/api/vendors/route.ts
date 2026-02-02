import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';

// GET - Get user's vendors
export async function GET(request: NextRequest) {
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
