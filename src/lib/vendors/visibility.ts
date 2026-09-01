import { Prisma } from '@prisma/client';

/**
 * Store visibility ("buffer") rules.
 *
 * A store is created hidden (`is_published: false`) and only becomes visible to
 * the public once an admin or the store owner publishes it. While it sits in the
 * buffer, admins can still assign products to it and the vendor can prepare its
 * catalogue — nothing of it reaches the shop.
 *
 * `is_active` stays a separate, stronger switch: it deactivates the store
 * account entirely (and blocks product assignment).
 */

/** Public store listings / store pages: active AND published. */
export const PUBLIC_VENDOR_WHERE = {
  is_active: true,
  is_published: true,
} satisfies Prisma.vendorsWhereInput;

/**
 * Products a visitor may see: platform-owned products (no vendor) plus products
 * of published stores. Products of a buffered store are hidden everywhere public
 * — listings, facets, search, product page, sitemap, add-to-cart.
 */
export const PUBLIC_PRODUCT_WHERE = {
  OR: [{ vendor_id: null }, { vendor: { is_published: true } }],
} satisfies Prisma.productsWhereInput;

/** True when a product fetched with its vendor is hidden behind an unpublished store. */
export function isProductHidden(product: { vendor: { is_published: boolean } | null }): boolean {
  return product.vendor !== null && !product.vendor.is_published;
}
