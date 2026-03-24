import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';
import { logAdminAction } from '@/lib/admin-log';

// GET /api/admin/users/[id]/cart
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (_req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const items = await prisma.cart_items.findMany({
      where: { user_id: id },
      include: {
        product: {
          select: {
            id: true, name: true, name_ka: true,
            price: true, sale_price: true,
            media: { take: 1, select: { url: true } },
          },
        },
        variant_option: { select: { id: true, name: true, name_ka: true, price: true, sale_price: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(items);
  });
}

// DELETE /api/admin/users/[id]/cart — clear entire cart
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (_req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    await prisma.cart_items.deleteMany({ where: { user_id: id } });
    await logAdminAction(admin.id, 'CART_CLEAR', id, 'Admin cleared user cart');

    return NextResponse.json({ message: 'Cart cleared' });
  });
}
