/**
 * The catalogue as the assistant sees it: plain rows in, an indexed in-memory
 * structure out. No database or framework imports (see catalogue.server.ts for
 * the loader).
 */
import { foldDocument } from './fold';
import { STOCK_LIMITS_ENABLED } from '@/lib/stock-policy';

export interface ProductRow {
  id: string;
  name: string;
  name_ka: string;
  description: string | null;
  description_ka: string | null;
  manufacturer: string | null;
  sku: string | null;
  price: number;
  sale_price: number | null;
  unit: string | null;
  stock: number;
  in_storage_stock: boolean;
  /** Lowest / highest customer price across variant options; null without variants. */
  variant_min_price: number | null;
  variant_max_price: number | null;
  /** Summed stock of all variant options; null without variants. */
  variant_stock: number | null;
  category_id: string | null;
  parent_category_id: string | null;
  image_url: string | null;
}

export interface CategoryRow {
  id: string;
  name: string;
  name_ka: string;
  parent_id: string | null;
}

/**
 * in_stock: on our shelf. special_order: kept at the vendor ("შეკვეთით"), always
 * orderable. out_of_stock: warehouse item with nothing left.
 */
export type Availability = 'in_stock' | 'special_order' | 'out_of_stock';

export interface Product extends ProductRow {
  /** Short handle shown to the model ("p12"): cheaper than a cuid, harder to fake. */
  ref: string;
  category_path: string;
  /** What the customer pays — the lowest variant price when the product has variants. */
  display_price: number;
  /** Struck-through original price, only for a product without variants on sale. */
  display_original_price: number | null;
  /** True when variant prices differ, so the price reads "from X". */
  price_from: boolean;
  availability: Availability;
  f_name: string;
  f_cat: string;
  f_all: string;
}

export interface Category extends CategoryRow {
  ref: string;
  product_count: number;
}

export interface Catalogue {
  products: Product[];
  byRef: Map<string, Product>;
  /** Only categories that contain at least one product. */
  categories: Category[];
  catById: Map<string, CategoryRow>;
  catByRef: Map<string, Category>;
  loadedAt: number;
}

// Same rule as getProductDisplayPricing (src/lib/product-pricing.ts): variant
// prices replace the product price whenever a product has variants.
function pricing(row: ProductRow) {
  if (row.variant_min_price !== null) {
    return {
      display_price: row.variant_min_price,
      display_original_price: null,
      price_from: (row.variant_max_price ?? row.variant_min_price) > row.variant_min_price,
    };
  }
  return {
    display_price: row.sale_price ?? row.price,
    display_original_price: row.sale_price !== null ? row.price : null,
    price_from: false,
  };
}

function availability(row: ProductRow): Availability {
  if (!row.in_storage_stock) return 'special_order';
  // While stock limits are off, nothing is out of stock.
  if (!STOCK_LIMITS_ENABLED) return 'in_stock';
  return (row.variant_stock ?? row.stock) > 0 ? 'in_stock' : 'out_of_stock';
}

export function buildCatalogue(rows: ProductRow[], categoryRows: CategoryRow[]): Catalogue {
  const catById = new Map(categoryRows.map((c) => [c.id, c]));
  const counts = new Map<string, number>();

  const products: Product[] = rows.map((row, i) => {
    for (const id of [row.category_id, row.parent_category_id]) {
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    const cat = row.category_id ? catById.get(row.category_id) : undefined;
    const parent = cat?.parent_id ? catById.get(cat.parent_id) : undefined;
    return {
      ...row,
      ...pricing(row),
      ref: `p${i + 1}`,
      category_path: [parent?.name_ka, cat?.name_ka].filter(Boolean).join(' > '),
      availability: availability(row),
      f_name: foldDocument(row.name, row.name_ka, row.manufacturer, row.sku),
      f_cat: foldDocument(cat?.name, cat?.name_ka, parent?.name, parent?.name_ka),
      f_all: foldDocument(row.name, row.name_ka, row.manufacturer, row.sku, row.description, row.description_ka),
    };
  });

  const categories: Category[] = categoryRows
    .filter((c) => (counts.get(c.id) ?? 0) > 0)
    .map((c, i) => ({ ...c, ref: `c${i + 1}`, product_count: counts.get(c.id) ?? 0 }));

  return {
    products,
    byRef: new Map(products.map((p) => [p.ref, p])),
    categories,
    catById,
    catByRef: new Map(categories.map((c) => [c.ref, c])),
    loadedAt: Date.now(),
  };
}
