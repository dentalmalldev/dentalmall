import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    const user = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!user || user.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const paymentStatus = searchParams.get('payment_status');
    const paymentMethod = searchParams.get('payment_method');
    const orderStatus = searchParams.get('status');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const vendorId = searchParams.get('vendor_id');

    // Build where clause
    const where: Record<string, unknown> = {};
    if (paymentStatus) where.payment_status = paymentStatus;
    if (paymentMethod) where.payment_method = paymentMethod;
    if (orderStatus) where.status = orderStatus;

    if (dateFrom || dateTo) {
      where.created_at = {
        ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
        ...(dateTo ? { lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999)) } : {}),
      };
    }

    if (search) {
      where.OR = [
        { order_number: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { first_name: { contains: search, mode: 'insensitive' } } },
        { user: { last_name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (vendorId) {
      where.items = { some: { product: { vendor_id: vendorId } } };
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
                  vendor: { select: { id: true, company_name: true } },
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
