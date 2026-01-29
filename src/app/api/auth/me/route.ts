import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';

export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          personal_id: true,
          auth_provider: true,
          role: true,
          created_at: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(user);
    } catch (error) {
      console.error('Get user error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
