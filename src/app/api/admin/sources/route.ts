import { NextRequest, NextResponse } from 'next/server';
import { withAuth, prisma } from '@/lib';

async function requireAdmin(uid: string) {
  const admin = await prisma.users.findUnique({ where: { firebase_uid: uid } });
  return admin && admin.role === 'ADMIN' ? admin : null;
}

// GET - List marketing sources with their registration counts (admin only).
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, authUser) => {
    if (!(await requireAdmin(authUser.uid))) {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
    }

    const sources = await prisma.marketing_sources.findMany({ orderBy: { created_at: 'desc' } });

    // One grouped count over users.source, then map by slug — no N+1.
    const grouped = await prisma.users.groupBy({
      by: ['source'],
      where: { source: { not: null } },
      _count: { _all: true },
    });
    const countBySlug = new Map(grouped.map((g) => [g.source as string, g._count._all]));

    const data = sources.map((s) => ({
      ...s,
      registrations: countBySlug.get(s.slug) ?? 0,
    }));

    return NextResponse.json({ data });
  });
}

// POST - Create a marketing source (admin only).
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    if (!(await requireAdmin(authUser.uid))) {
      return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const rawSlug = typeof body.slug === 'string' ? body.slug : '';
    // Normalize the slug to a clean, URL-safe ?source= value.
    const slug = rawSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) {
      return NextResponse.json({ error: 'A valid source code is required' }, { status: 400 });
    }

    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : slug;

    const existing = await prisma.marketing_sources.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'A source with this code already exists' }, { status: 409 });
    }

    const source = await prisma.marketing_sources.create({ data: { name, slug } });
    return NextResponse.json(source, { status: 201 });
  });
}
