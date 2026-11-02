import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma, withAuth } from '@/lib';
import { logAdminAction } from '@/lib/admin-log';

const PAGE_SIZE = 25;
const FILTERS = ['all', 'no_products', 'disliked', 'liked', 'errors'] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_WHERE: Record<Filter, Prisma.assistant_logsWhereInput> = {
  all: {},
  // Answered, but nothing to show: what people want that we don't stock (or can't find).
  no_products: { error: null, product_ids: { isEmpty: true } },
  disliked: { helpful: false },
  liked: { helpful: true },
  errors: { error: { not: null } },
};

// GET /api/admin/assistant/logs?filter=&search=&page= - Questions customers asked, newest first.
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const adminUser = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
      }

      const { searchParams } = new URL(req.url);
      const filterParam = searchParams.get('filter') as Filter | null;
      const filter: Filter = filterParam && FILTERS.includes(filterParam) ? filterParam : 'all';
      const search = searchParams.get('search')?.trim();
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

      const where: Prisma.assistant_logsWhereInput = {
        ...FILTER_WHERE[filter],
        ...(search ? { question: { contains: search, mode: 'insensitive' } } : {}),
      };

      const [rows, total] = await Promise.all([
        prisma.assistant_logs.findMany({
          where,
          orderBy: { created_at: 'desc' },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        prisma.assistant_logs.count({ where }),
      ]);

      // Names of the products each answer showed (they may since have been deleted).
      const ids = [...new Set(rows.flatMap((r) => r.product_ids))];
      const products = ids.length
        ? await prisma.products.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, name_ka: true } })
        : [];
      const byId = new Map(products.map((p) => [p.id, p]));

      return NextResponse.json({
        data: rows.map((r) => ({
          ...r,
          products: r.product_ids.map((id) => byId.get(id) ?? { id, name: null, name_ka: null }),
        })),
        pagination: { page, limit: PAGE_SIZE, total, total_pages: Math.ceil(total / PAGE_SIZE) },
      });
    } catch (error) {
      console.error('Get assistant logs error:', error);
      return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
    }
  });
}

// DELETE /api/admin/assistant/logs?older_than_days=180 - Retention: questions are
// free text typed by customers, so they are kept only as long as needed.
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const adminUser = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
      }

      const days = parseInt(new URL(req.url).searchParams.get('older_than_days') || '', 10);
      if (!Number.isInteger(days) || days < 1) {
        return NextResponse.json({ error: 'older_than_days must be a whole number of at least 1' }, { status: 400 });
      }

      const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const { count } = await prisma.assistant_logs.deleteMany({ where: { created_at: { lt: cutoff } } });
      await logAdminAction(adminUser.id, 'ASSISTANT_LOGS_DELETED', undefined, `${count} questions older than ${days} days`);

      return NextResponse.json({ deleted: count });
    } catch (error) {
      console.error('Delete assistant logs error:', error);
      return NextResponse.json({ error: 'Failed to delete conversations' }, { status: 500 });
    }
  });
}
