import { NextRequest, NextResponse } from 'next/server';
import { withAuth, prisma } from '@/lib';

// DELETE - Remove a marketing source (admin only). Existing users keep their
// recorded `source` value; only the curated list entry is removed.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await prisma.marketing_sources.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    await prisma.marketing_sources.delete({ where: { id } });
    return NextResponse.json({ message: 'Source deleted' });
  });
}
