import type { Product, VariantType } from '@/types/models';

type VariantSource = Pick<Product, 'price' | 'sale_price'> & {
  variant_types?: VariantType[];
};

export function hasProductVariants(product?: VariantSource | null): boolean {
  return !!product?.variant_types?.some((vt) => (vt.options?.length ?? 0) > 0);
}

export interface DisplayPricing {
  hasVariants: boolean;
  /** Lowest "what the customer pays" price across variants (or product) */
  minPrice: number;
  /** Highest "what the customer pays" price across variants (only meaningful when hasVariants) */
  maxPrice: number;
  /** Lowest original (non-sale) price — used for strikethrough */
  minOriginalPrice: number | null;
  /** True when at least one variant (or the product) has a sale price */
  hasSale: boolean;
  /** Discount % derived from the lowest sale */
  discount: number | null;
}

/**
 * Compute the price to display on cards / detail pages.
 * Variant prices take precedence whenever a product has variants.
 */
export function getProductDisplayPricing(product: VariantSource): DisplayPricing {
  const hasVariants = hasProductVariants(product);

  if (!hasVariants) {
    const price = parseFloat(product.price);
    const salePrice = product.sale_price ? parseFloat(product.sale_price) : null;
    const final = salePrice ?? price;
    return {
      hasVariants: false,
      minPrice: final,
      maxPrice: final,
      minOriginalPrice: salePrice ? price : null,
      hasSale: salePrice !== null,
      discount: salePrice ? Math.round((1 - salePrice / price) * 100) : null,
    };
  }

  const options = product.variant_types!.flatMap((vt) => vt.options ?? []);
  // Customer-facing price = sale_price ?? dentalmall_price. Vendor-facing `price` is internal.
  const finals = options.map((o) =>
    o.sale_price ? parseFloat(o.sale_price) : parseFloat(o.dentalmall_price)
  );
  const minFinal = Math.min(...finals);
  const maxFinal = Math.max(...finals);

  // Lowest original price among options that are on sale — only used for strikethrough
  const onSaleOriginals = options
    .filter((o) => o.sale_price !== null)
    .map((o) => parseFloat(o.dentalmall_price));
  const minOriginal = onSaleOriginals.length > 0 ? Math.min(...onSaleOriginals) : null;

  return {
    hasVariants: true,
    minPrice: minFinal,
    maxPrice: maxFinal,
    minOriginalPrice: minOriginal,
    hasSale: onSaleOriginals.length > 0,
    discount: minOriginal !== null ? Math.round((1 - minFinal / minOriginal) * 100) : null,
  };
}
