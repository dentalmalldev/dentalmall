import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';

// GET /api/cart - Get user's cart items
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, authUser) => {
    try {
      // Get user from database
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const cartItems = await prisma.cart_items.findMany({
        where: { user_id: user.id },
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
        orderBy: { created_at: 'desc' },
      });

      return NextResponse.json(cartItems);
    } catch (error) {
      console.error('Get cart error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const body = await req.json();
      const { product_id, quantity = 1 } = body;

      if (!product_id) {
        return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
      }

      // Get user from database
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Check if product exists
      const product = await prisma.products.findUnique({
        where: { id: product_id },
      });

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      // Check if item already in cart
      const existingItem = await prisma.cart_items.findUnique({
        where: {
          user_id_product_id: {
            user_id: user.id,
            product_id,
          },
        },
      });

      let cartItem;

      if (existingItem) {
        // Update quantity
        cartItem = await prisma.cart_items.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
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
      } else {
        // Create new cart item
        cartItem = await prisma.cart_items.create({
          data: {
            user_id: user.id,
            product_id,
            quantity,
          },
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
      }

      return NextResponse.json(cartItem, { status: existingItem ? 200 : 201 });
    } catch (error) {
      console.error('Add to cart error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

// DELETE /api/cart - Clear entire cart
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      await prisma.cart_items.deleteMany({
        where: { user_id: user.id },
      });

      return NextResponse.json({ message: 'Cart cleared' });
    } catch (error) {
      console.error('Clear cart error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
