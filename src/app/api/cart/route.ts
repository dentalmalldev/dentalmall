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
              discount_percent: true,
              media: true,
              manufacturer: true,
              stock: true,
              variants: true,
            },
          },
          variant: true,
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
      const { product_id, variant_id, quantity = 1 } = body;

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

      // Check if product exists with variants
      const product = await prisma.products.findUnique({
        where: { id: product_id },
        include: { variants: true },
      });

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      // If product has variants, require variant_id
      if (product.variants.length > 0 && !variant_id) {
        return NextResponse.json({ error: 'Variant selection is required' }, { status: 400 });
      }

      // Validate variant belongs to product
      if (variant_id) {
        const variant = product.variants.find((v) => v.id === variant_id);
        if (!variant) {
          return NextResponse.json({ error: 'Invalid variant' }, { status: 400 });
        }
        // Check variant stock
        if (variant.stock < quantity) {
          return NextResponse.json({ error: 'Insufficient variant stock' }, { status: 400 });
        }
      }

      const cartInclude = {
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
            variants: true,
          },
        },
        variant: true,
      };

      // Check if item already in cart (same product + variant combo)
      const existingItem = await prisma.cart_items.findUnique({
        where: {
          user_id_product_id_variant_id: {
            user_id: user.id,
            product_id,
            variant_id: variant_id || null,
          },
        },
      });

      let cartItem;

      if (existingItem) {
        // Update quantity
        cartItem = await prisma.cart_items.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
          include: cartInclude,
        });
      } else {
        // Create new cart item
        cartItem = await prisma.cart_items.create({
          data: {
            user_id: user.id,
            product_id,
            variant_id: variant_id || null,
            quantity,
          },
          include: cartInclude,
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
