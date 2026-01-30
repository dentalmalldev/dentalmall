import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';

// GET - Get user's clinics
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const clinics = await prisma.clinics.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
      });

      return NextResponse.json(clinics);
    } catch (error) {
      console.error('Error fetching clinics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch clinics' },
        { status: 500 }
      );
    }
  });
}
