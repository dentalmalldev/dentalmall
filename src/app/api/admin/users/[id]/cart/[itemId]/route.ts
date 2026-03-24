import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';
import { logAdminAction } from '@/lib/admin-log';

// DELETE /api/admin/users/[id]/cart/[itemId]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  return withAuth(request, async (_req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id, itemId } = await params;
    const item = await prisma.cart_items.findFirst({ where: { id: itemId, user_id: id } });
    if (!item) return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });

    await prisma.cart_items.delete({ where: { id: itemId } });
    await logAdminAction(admin.id, 'CART_ITEM_REMOVE', id, `Removed cart item ${itemId}`);

    return NextResponse.json({ message: 'Item removed' });
  });
}
