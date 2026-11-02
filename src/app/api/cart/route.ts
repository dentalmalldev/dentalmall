import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';
import { addToCartChecked } from '@/lib/cart/add-to-cart';
import { stripCostPrices } from '@/lib/products/publicPricing';

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
              discount_percent: true,
              media: true,
              manufacturer: true,
              stock: true,
              in_storage_stock: true,
              variant_types: { include: { options: true } },
            },
          },
          variant_option: true,
        },
        orderBy: { created_at: 'desc' },
      });

      return NextResponse.json(stripCostPrices(cartItems));
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
      const { product_id, variant_option_id, quantity = 1 } = body;

      if (!product_id) {
        return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        return NextResponse.json({ error: 'Valid quantity is required' }, { status: 400 });
      }

      // Get user from database
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const result = await addToCartChecked(user.id, product_id, variant_option_id || null, quantity);

      if (!result.ok) {
        switch (result.reason) {
          // Products of a store still in the buffer aren't purchasable.
          case 'not_found':
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
          case 'needs_variant':
            return NextResponse.json({ error: 'Please select a product variant' }, { status: 400 });
          case 'invalid_variant':
            return NextResponse.json({ error: 'Invalid variant option' }, { status: 400 });
          case 'insufficient_stock':
            return NextResponse.json(
              {
                error: variant_option_id ? 'Insufficient variant stock' : 'Insufficient stock',
                code: 'INSUFFICIENT_STOCK',
                available: result.available,
              },
              { status: 400 }
            );
        }
      }

      const cartItem = await prisma.cart_items.findUniqueOrThrow({
        where: { id: result.cartItemId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              name_ka: true,
              price: true,
              sale_price: true,
              discount_percent: true,
              media: true,
              manufacturer: true,
              stock: true,
              in_storage_stock: true,
              variant_types: { include: { options: true } },
            },
          },
          variant_option: true,
        },
      });

      return NextResponse.json(stripCostPrices(cartItem), { status: result.increased ? 200 : 201 });
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
