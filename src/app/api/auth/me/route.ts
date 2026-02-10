import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';
import { updateProfileZodSchema } from '@/lib/validations/auth';

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

export async function PUT(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const body = await req.json();
      const validationResult = updateProfileZodSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error },
          { status: 400 }
        );
      }

      const data = validationResult.data;

      // Check personal_id uniqueness if provided
      if (data.personal_id) {
        const existing = await prisma.users.findFirst({
          where: {
            personal_id: data.personal_id,
            firebase_uid: { not: authUser.uid },
          },
        });

        if (existing) {
          return NextResponse.json(
            { error: 'Personal ID is already in use' },
            { status: 400 }
          );
        }
      }

      const user = await prisma.users.update({
        where: { firebase_uid: authUser.uid },
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          personal_id: data.personal_id || null,
        },
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

      return NextResponse.json(user);
    } catch (error) {
      console.error('Update profile error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}
