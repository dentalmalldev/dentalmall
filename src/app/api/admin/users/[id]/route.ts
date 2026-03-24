import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';

async function getAdmin(uid: string) {
  const admin = await prisma.users.findUnique({ where: { firebase_uid: uid } });
  if (!admin || admin.role !== 'ADMIN') return null;
  return admin;
}

// GET /api/admin/users/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (_req, authUser) => {
    if (!await getAdmin(authUser.uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        firebase_uid: true,
        email: true,
        first_name: true,
        last_name: true,
        personal_id: true,
        auth_provider: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
        addresses: {
          orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
        },
        vendors: {
          select: {
            id: true,
            company_name: true,
            identification_number: true,
            email: true,
            description: true,
            city: true,
            address: true,
            phone_number: true,
            logo: true,
            is_active: true,
            _count: { select: { products: true } },
          },
        },
        clinics: {
          select: {
            id: true,
            clinic_name: true,
            identification_number: true,
            email: true,
            description: true,
            city: true,
            address: true,
            phone_number: true,
            is_active: true,
          },
        },
        _count: { select: { orders: true, cart_items: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Stats
    const orders = await prisma.orders.findMany({
      where: { user_id: id },
      select: { total: true },
    });
    const totalSpent = orders.reduce((sum, o) => sum + parseFloat(String(o.total)), 0);

    return NextResponse.json({
      user,
      vendor: user.vendors[0] || null,
      clinic: user.clinics[0] || null,
      addresses: user.addresses,
      stats: {
        totalOrders: user._count.orders,
        totalSpent,
        cartItems: user._count.cart_items,
      },
    });
  });
}

// PATCH /api/admin/users/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (req, authUser) => {
    const adminUser = await getAdmin(authUser.uid);
    if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { first_name, last_name, email, personal_id, role, is_active } = body;

    const targetUser = await prisma.users.findUnique({ where: { id } });
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (targetUser.firebase_uid === authUser.uid) {
      // Admin can't change own role or disable own account
      if (role !== undefined || is_active === false) {
        return NextResponse.json({ error: 'Cannot modify your own role or status' }, { status: 400 });
      }
    }

    const validRoles = ['USER', 'VENDOR', 'CLINIC', 'ADMIN', 'ACCOUNTANT'];
    if (role !== undefined && !validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (first_name !== undefined) data.first_name = first_name;
    if (last_name !== undefined) data.last_name = last_name;
    if (email !== undefined) data.email = email;
    if (personal_id !== undefined) data.personal_id = personal_id || null;
    if (role !== undefined) data.role = role;
    if (is_active !== undefined) data.is_active = is_active;

    const updated = await prisma.users.update({
      where: { id },
      data,
      select: {
        id: true, email: true, first_name: true, last_name: true,
        personal_id: true, auth_provider: true, role: true, is_active: true,
        created_at: true, updated_at: true,
      },
    });

    return NextResponse.json(updated);
  });
}

// DELETE /api/admin/users/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (_req, authUser) => {
    if (!await getAdmin(authUser.uid)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    const targetUser = await prisma.users.findUnique({ where: { id } });
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (targetUser.firebase_uid === authUser.uid) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await prisma.users.delete({ where: { id } });
    return NextResponse.json({ message: 'User deleted' });
  });
}
