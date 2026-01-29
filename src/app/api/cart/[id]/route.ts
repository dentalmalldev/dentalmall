import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';

// PUT /api/cart/[id] - Update cart item quantity
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, authUser) => {
    try {
      const { id } = await params;
      const body = await req.json();
      const { quantity } = body;

      if (!quantity || quantity < 1) {
        return NextResponse.json({ error: 'Valid quantity is required' }, { status: 400 });
      }

      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check if cart item exists and belongs to user
      const cartItem = await prisma.cart_items.findFirst({
        where: { id, user_id: user.id },
      });

      if (!cartItem) {
        return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
      }

      const updatedItem = await prisma.cart_items.update({
        where: { id },
        data: { quantity },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              name_ka: true,
              price: true,
              sale_price: true,
              images: true,
              manufacturer: true,
              stock: true,
            },
          },
        },
      });

      return NextResponse.json(updatedItem);
    } catch (error) {
      console.error('Update cart item error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

// DELETE /api/cart/[id] - Remove item from cart
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const { id } = await params;

      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check if cart item exists and belongs to user
      const cartItem = await prisma.cart_items.findFirst({
        where: { id, user_id: user.id },
      });

      if (!cartItem) {
        return NextResponse.json({ error: 'Cart item not found' }, { status: 404 });
      }

      await prisma.cart_items.delete({
        where: { id },
      });

      return NextResponse.json({ message: 'Item removed from cart' });
    } catch (error) {
      console.error('Remove cart item error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
