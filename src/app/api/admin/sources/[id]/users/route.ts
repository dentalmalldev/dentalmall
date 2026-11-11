import { NextRequest, NextResponse } from 'next/server';
import { withAuth, prisma } from '@/lib';

// Newest first; a cap keeps the response bounded for a very popular QR code.
const USERS_LIMIT = 1000;

// GET - Users who registered through this marketing source (their
// users.source equals its slug), newest first. Admin only.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
    }

    const { id } = await params;
    const source = await prisma.marketing_sources.findUnique({ where: { id }, select: { slug: true } });
    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where: { source: source.slug },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone_number: true,
          created_at: true,
          _count: { select: { orders: true } },
        },
        orderBy: { created_at: 'desc' },
        take: USERS_LIMIT,
      }),
      prisma.users.count({ where: { source: source.slug } }),
    ]);

    return NextResponse.json({ data: users, total });
  });
}
