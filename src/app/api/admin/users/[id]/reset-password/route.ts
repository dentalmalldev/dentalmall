import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';
import { generatePasswordResetLink } from '@/lib/firebase-admin';

// POST /api/admin/users/[id]/reset-password
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (_req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.auth_provider !== 'EMAIL') {
      return NextResponse.json({ error: 'User uses social login, password reset not applicable' }, { status: 400 });
    }

    const resetLink = await generatePasswordResetLink(user.email);
    return NextResponse.json({ reset_link: resetLink, message: 'Password reset link generated' });
  });
}
