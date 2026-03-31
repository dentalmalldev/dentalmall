import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    const user = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!user || user.role !== 'STORAGE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const tab = searchParams.get('tab');

    // Only show paid orders (payment confirmed)
    const where: Record<string, unknown> = {
      payment_status: 'PAID',
    };

    // Tab-based filtering
    if (tab === 'to_prepare') {
      where.status = 'PROCESSING';
    } else if (tab === 'ready') {
      where.status = 'READY_FOR_DELIVERY';
    } else if (tab === 'out') {
      where.status = 'OUT_FOR_DELIVERY';
    } else if (tab === 'delivered') {
      where.status = 'DELIVERED';
    } else if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { order_number: { contains: search, mode: 'insensitive' } },
        { user: { first_name: { contains: search, mode: 'insensitive' } } },
        { user: { last_name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, first_name: true, last_name: true } },
          address: true,
          items: {
            include: {
              product: {
                include: {
                  media: { take: 1 },
                },
              },
              variant_option: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.orders.count({ where }),
    ]);

    return NextResponse.json({
      data: orders,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    });
  });
}
