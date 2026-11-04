import { prisma } from '@/lib';
import { isProductHidden } from '@/lib/vendors/visibility';

export type CartAddResult =
  | { ok: true; cartItemId: string; /** The line already existed and its quantity went up. */ increased: boolean }
  | {
      ok: false;
      reason: 'not_found' | 'needs_variant' | 'invalid_variant' | 'insufficient_stock';
      /** Stock of the product (or chosen option), for insufficient_stock. */
      available?: number;
    };

/**
 * The one place a line is added to a cart. Every add — single (POST /api/cart)
 * or bulk (favorites) — goes through these guards:
 *  - products of an unpublished store aren't purchasable,
 *  - a product with variants needs one chosen, and it must be its own,
 *  - the cart can't hold more than the stock left, counting what's already in
 *    it (otherwise adding one at a time gets past stock).
 * An existing line for the same product + variant has its quantity increased.
 */
export async function addToCartChecked(
  userId: string,
  productId: string,
  variantOptionId: string | null,
  quantity: number
): Promise<CartAddResult> {
  const product = await prisma.products.findUnique({
    where: { id: productId },
    include: {
      variant_types: { include: { options: true } },
      vendor: { select: { is_published: true } },
    },
  });
  if (!product || isProductHidden(product)) return { ok: false, reason: 'not_found' };

  const allOptions = product.variant_types.flatMap((vt) => vt.options);
  if (allOptions.length > 0 && !variantOptionId) return { ok: false, reason: 'needs_variant' };

  let available = product.stock;
  if (variantOptionId) {
    const option = allOptions.find((o) => o.id === variantOptionId);
    if (!option) return { ok: false, reason: 'invalid_variant' };
    available = option.stock;
  }

  const existing = variantOptionId
    ? await prisma.cart_items.findUnique({
        where: {
          user_id_product_id_variant_option_id: {
            user_id: userId,
            product_id: productId,
            variant_option_id: variantOptionId,
          },
        },
      })
    : await prisma.cart_items.findFirst({
        where: { user_id: userId, product_id: productId, variant_option_id: null },
      });

  if ((existing?.quantity ?? 0) + quantity > available) {
    return { ok: false, reason: 'insufficient_stock', available: Math.max(0, available) };
  }

  if (existing) {
    await prisma.cart_items.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
    return { ok: true, cartItemId: existing.id, increased: true };
  }

  const created = await prisma.cart_items.create({
    data: { user_id: userId, product_id: productId, variant_option_id: variantOptionId, quantity },
  });
  return { ok: true, cartItemId: created.id, increased: false };
}
