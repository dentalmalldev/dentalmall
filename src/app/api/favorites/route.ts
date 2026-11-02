import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma, withAuth } from '@/lib';
import { isProductHidden, PUBLIC_PRODUCT_WHERE } from '@/lib/vendors/visibility';
import { MEDIA_ORDER_BY } from '@/lib/products/mediaOrder';
import { stripCostPrices } from '@/lib/products/publicPricing';

// Everything the list needs to price and label a product (see
// getProductDisplayPricing). Cost prices are left out here and stripped again
// before the response.
const FAVORITE_PRODUCT_SELECT = {
  id: true,
  name: true,
  name_ka: true,
  price: true,
  sale_price: true,
  stock: true,
  in_storage_stock: true,
  media: { orderBy: MEDIA_ORDER_BY, take: 1 },
  variant_types: {
    include: {
      options: {
        select: {
          id: true,
          variant_type_id: true,
          name: true,
          name_ka: true,
          sku: true,
          price: true,
          sale_price: true,
          stock: true,
          created_at: true,
          updated_at: true,
        },
      },
    },
  },
} satisfies Prisma.productsSelect;

// GET /api/favorites - The caller's favorites, newest first. Products of an
// unpublished store are left out but their rows are kept, so they come back
// when the store is republished.
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const user = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const favorites = await prisma.favorites.findMany({
        where: { user_id: user.id, product: PUBLIC_PRODUCT_WHERE },
        select: {
          id: true,
          product_id: true,
          notify_on_restock: true,
          created_at: true,
          product: { select: FAVORITE_PRODUCT_SELECT },
        },
        orderBy: { created_at: 'desc' },
      });

      return NextResponse.json(stripCostPrices(favorites));
    } catch (error) {
      console.error('Get favorites error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

// POST /api/favorites { product_id } - Save a product. Idempotent: saving it
// again leaves the single existing row.
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const body = await req.json().catch(() => ({}));
      const productId = typeof body.product_id === 'string' ? body.product_id : null;
      if (!productId) {
        return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
      }

      const user = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const product = await prisma.products.findUnique({
        where: { id: productId },
        select: { id: true, vendor: { select: { is_published: true } } },
      });
      // A product of a store still in the buffer is treated as non-existent publicly.
      if (!product || isProductHidden(product)) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      await prisma.favorites.upsert({
        where: { user_id_product_id: { user_id: user.id, product_id: productId } },
        create: { user_id: user.id, product_id: productId },
        update: {},
      });

      return NextResponse.json({ product_id: productId }, { status: 201 });
    } catch (error) {
      console.error('Add favorite error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
