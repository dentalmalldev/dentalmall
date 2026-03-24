import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (_req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = { user_id: id };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        include: {
          address: { select: { city: true, address: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, name_ka: true } },
              variant_option: { select: { name: true, name_ka: true } },
            },
          },
          _count: { select: { items: true } },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.orders.count({ where }),
    ]);

    return NextResponse.json({ data: orders, total, page, total_pages: Math.ceil(total / limit) });
  });
}
