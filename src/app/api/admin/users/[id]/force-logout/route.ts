import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';
import { revokeUserSessions } from '@/lib/firebase-admin';

// POST /api/admin/users/[id]/force-logout
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (_req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await revokeUserSessions(user.firebase_uid);
    return NextResponse.json({ message: 'All sessions revoked' });
  });
}
