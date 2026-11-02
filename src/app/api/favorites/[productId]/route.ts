import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';

// DELETE /api/favorites/[productId] - Remove a product from the caller's
// favorites. Scoped by user_id, so another user's favorite can't be touched;
// removing one that isn't saved is a no-op.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const { productId } = await params;

      const user = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      await prisma.favorites.deleteMany({ where: { user_id: user.id, product_id: productId } });

      return NextResponse.json({ message: 'Removed from favorites' });
    } catch (error) {
      console.error('Remove favorite error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
