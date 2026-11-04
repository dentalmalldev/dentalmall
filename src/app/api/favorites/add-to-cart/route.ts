import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';
import { addToCartChecked } from '@/lib/cart/add-to-cart';
import type { FavoriteCartOutcome, FavoriteCartResult } from '@/types/models';

// POST /api/favorites/add-to-cart { product_ids? } - Add favorites to the cart,
// one unit each. Partial, never all-or-nothing: every product reports what
// happened. Defaults to all of the caller's favorites; product_ids narrows that
// to the ones on screen, and anything not among the caller's favorites is ignored.
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const body = await req.json().catch(() => ({}));
      const requested: string[] | null = Array.isArray(body.product_ids)
        ? body.product_ids.filter((id: unknown): id is string => typeof id === 'string')
        : null;

      const user = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const favorites = await prisma.favorites.findMany({
        where: { user_id: user.id, ...(requested ? { product_id: { in: requested } } : {}) },
        select: { product: { select: { id: true, name: true, name_ka: true } } },
        orderBy: { created_at: 'desc' },
      });

      // Sequential on purpose: each add reads the cart the previous one wrote.
      const results: FavoriteCartResult[] = [];
      for (const { product } of favorites) {
        // Same guards as a single add; a product with variants is reported as
        // needing one chosen rather than guessed.
        const result = await addToCartChecked(user.id, product.id, null, 1);
        let outcome: FavoriteCartOutcome;
        if (result.ok) outcome = result.increased ? 'already_in_cart' : 'added';
        else if (result.reason === 'needs_variant') outcome = 'needs_variant';
        else if (result.reason === 'insufficient_stock') outcome = result.available ? 'stock_limit' : 'out_of_stock';
        else outcome = 'unavailable';
        results.push({ product_id: product.id, name: product.name, name_ka: product.name_ka, outcome });
      }

      return NextResponse.json({ results });
    } catch (error) {
      console.error('Add favorites to cart error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
