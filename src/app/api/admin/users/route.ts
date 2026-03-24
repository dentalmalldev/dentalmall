import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';

// GET /api/admin/users
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, authUser) => {
    const adminUser = await prisma.users.findUnique({
      where: { firebase_uid: authUser.uid },
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const provider = searchParams.get('provider') || '';
    const dateRange = searchParams.get('dateRange') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { personal_id: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role && role !== 'ALL') {
      where.role = role;
    }

    if (status === 'ACTIVE') {
      where.is_active = true;
    } else if (status === 'INACTIVE') {
      where.is_active = false;
    }

    if (provider && provider !== 'ALL') {
      where.auth_provider = provider;
    }

    if (dateRange) {
      const now = new Date();
      const days = parseInt(dateRange);
      if (!isNaN(days)) {
        where.created_at = {
          gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
        };
      }
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          personal_id: true,
          auth_provider: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          _count: { select: { orders: true } },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.users.count({ where }),
    ]);

    // Stats
    const [totalCount, activeCount, vendorCount, clinicCount] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({ where: { is_active: true } }),
      prisma.users.count({ where: { role: 'VENDOR' } }),
      prisma.users.count({ where: { role: 'CLINIC' } }),
    ]);

    return NextResponse.json({
      data: users,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
      stats: { total: totalCount, active: activeCount, vendors: vendorCount, clinics: clinicCount },
    });
  });
}
