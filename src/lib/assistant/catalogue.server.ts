/**
 * Loads the catalogue through Prisma and keeps it in memory for 10 minutes per
 * server instance. ~1,000 products is a few MB; every assistant search after
 * the first is a local scan, not a query.
 *
 * Visibility follows PUBLIC_PRODUCT_WHERE (src/lib/vendors/visibility.ts):
 * platform-owned products plus products of published stores. Keep the two in
 * step if that rule changes.
 *
 * products.dentalmall_price and variant_options.dentalmall_price (cost prices)
 * are never selected. Nothing downstream, the model included, can leak what it
 * never received.
 */
import { prisma } from '@/lib';
import { buildCatalogue, type Catalogue, type CategoryRow, type ProductRow } from './catalogue';

const TTL_MS = 10 * 60_000;

let cache: { at: number; value: Promise<Catalogue> } | null = null;

async function load(): Promise<Catalogue> {
  const [rows, categories] = await Promise.all([
    prisma.$queryRaw<ProductRow[]>`
      SELECT p.id, p.name, p.name_ka, p.description, p.description_ka, p.manufacturer, p.sku,
             p.price::float8 AS price, p.sale_price::float8 AS sale_price, p.unit, p.stock::int AS stock,
             p.in_storage_stock,
             vo.min_price::float8 AS variant_min_price, vo.max_price::float8 AS variant_max_price,
             vo.stock::int AS variant_stock,
             p.category_id, c.parent_id AS parent_category_id,
             -- Product's own photo first; else a variant's (e.g. a composite shade).
             (SELECT m.url FROM media m
               WHERE m.product_id = p.id AND m.type = 'image'
               ORDER BY m.variant_option_id NULLS FIRST, m.sort_order, m.created_at LIMIT 1) AS image_url
      FROM products p
      LEFT JOIN vendors v ON v.id = p.vendor_id
      LEFT JOIN categories c ON c.id = p.category_id
      LEFT JOIN LATERAL (
        SELECT min(COALESCE(o.sale_price, o.price)) AS min_price,
               max(COALESCE(o.sale_price, o.price)) AS max_price,
               sum(o.stock) AS stock
        FROM variant_types vt
        JOIN variant_options o ON o.variant_type_id = vt.id
        WHERE vt.product_id = p.id
      ) vo ON true
      WHERE p.vendor_id IS NULL OR v.is_published
      ORDER BY p.created_at`,
    prisma.$queryRaw<CategoryRow[]>`SELECT id, name, name_ka, parent_id FROM categories`,
  ]);
  return buildCatalogue(rows, categories);
}

export async function getCatalogue(): Promise<Catalogue> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  const previous = cache;
  const fresh = load();
  cache = { at: Date.now(), value: fresh };
  try {
    return await fresh;
  } catch (err) {
    // Database hiccup: keep serving the last good catalogue rather than failing.
    if (previous) {
      cache = previous;
      console.error('[assistant] catalogue reload failed, serving stale copy', err);
      return previous.value;
    }
    cache = null;
    throw err;
  }
}
