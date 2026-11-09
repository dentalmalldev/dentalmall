import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '@/lib';
import { PUBLIC_PRODUCT_WHERE } from '@/lib/vendors/visibility';
import { MEDIA_ORDER_BY } from '@/lib/products/mediaOrder';

export const PURCHASED_PAGE_SIZE = 25;

/**
 * Position just after the last entry of a page, in the list's sort order:
 * total quantity desc, latest delivery desc, product id asc, variant id asc.
 * Keyset rather than offset, so an entry that drops out between two loads
 * (sold out, store unpublished) can't make the next page skip one.
 */
const cursorSchema = z.object({
  q: z.number().int().nonnegative(),
  d: z.number().int(),
  p: z.string().min(1),
  v: z.string(),
});
type PurchasedCursor = z.infer<typeof cursorSchema>;

function encodeCursor(cursor: PurchasedCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

/** Null when the cursor isn't one this endpoint issued. */
export function decodePurchasedCursor(raw: string): PurchasedCursor | null {
  try {
    const parsed = cursorSchema.safeParse(JSON.parse(Buffer.from(raw, 'base64url').toString('utf8')));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

interface PurchasedRow {
  product_id: string;
  variant_option_id: string | null;
  /** variant_option_id, or '' for none: the tie-break key */
  variant_key: string;
  total_quantity: number;
  /** Latest delivery, ms since epoch. int8 may arrive as bigint or string. */
  last_delivered_ms: bigint | string | number;
}

/**
 * One row per product + variant the user has had delivered, already filtered
 * to what can be bought again and sorted. Everything happens in SQL so a page
 * is always full (filtering after LIMIT would leave short pages) and ties are
 * broken by the latest delivery, which Prisma's groupBy can't order by.
 *
 * - Bought = items of the user's DELIVERED orders, except orders refunded in
 *   full. Summing order_items can't double count a split group: each cart line
 *   goes into exactly one of the two sibling orders.
 * - Visibility mirrors PUBLIC_PRODUCT_WHERE (the hydration step re-applies the
 *   constant itself, so a product can never leak through a mismatch here).
 * - In-storage products need stock: the bought option's, or for an entry with
 *   no option, the product's (any option's, if it has gained variants or the
 *   bought option was deleted since). Special-order products always stay.
 * - EXTRACT(EPOCH) on a timestamp without time zone is the UTC instant, so the
 *   cursor compares plain integers and never meets a session time zone.
 */
async function findPurchasedRows(
  userId: string,
  cursor: PurchasedCursor | null,
  limit: number
): Promise<PurchasedRow[]> {
  const after = cursor
    ? Prisma.sql`(
        total_quantity < ${cursor.q}::int
        OR (total_quantity = ${cursor.q}::int AND (
          last_delivered_ms < ${cursor.d}::bigint
          OR (last_delivered_ms = ${cursor.d}::bigint AND (
            product_id > ${cursor.p}::text
            OR (product_id = ${cursor.p}::text AND variant_key > ${cursor.v}::text)
          ))
        ))
      )`
    : Prisma.sql`TRUE`;

  return prisma.$queryRaw<PurchasedRow[]>`
    WITH bought AS (
      SELECT
        oi.product_id,
        oi.variant_option_id,
        SUM(oi.quantity)::int AS total_quantity,
        (EXTRACT(EPOCH FROM MAX(COALESCE(o.delivered_at, o.updated_at))) * 1000)::bigint AS last_delivered_ms
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.user_id = ${userId}
        AND o.status = 'DELIVERED'
        AND o.payment_status <> 'REFUNDED'
      GROUP BY oi.product_id, oi.variant_option_id
    ),
    listed AS (
      SELECT
        b.product_id,
        b.variant_option_id,
        COALESCE(b.variant_option_id, '') AS variant_key,
        b.total_quantity,
        b.last_delivered_ms
      FROM bought b
      JOIN products p ON p.id = b.product_id
      LEFT JOIN vendors v ON v.id = p.vendor_id
      LEFT JOIN variant_options vo ON vo.id = b.variant_option_id
      WHERE (p.vendor_id IS NULL OR v.is_published)
        AND (
          NOT p.in_storage_stock
          OR (b.variant_option_id IS NOT NULL AND vo.stock > 0)
          OR (b.variant_option_id IS NULL AND CASE
                WHEN EXISTS (
                  SELECT 1 FROM variant_types vt
                  JOIN variant_options o2 ON o2.variant_type_id = vt.id
                  WHERE vt.product_id = p.id
                )
                THEN EXISTS (
                  SELECT 1 FROM variant_types vt
                  JOIN variant_options o2 ON o2.variant_type_id = vt.id
                  WHERE vt.product_id = p.id AND o2.stock > 0
                )
                ELSE p.stock > 0
              END)
        )
    )
    SELECT product_id, variant_option_id, variant_key, total_quantity, last_delivered_ms
    FROM listed
    WHERE ${after}
    ORDER BY total_quantity DESC, last_delivered_ms DESC, product_id ASC, variant_key ASC
    LIMIT ${limit}::int
  `;
}

// What a card and the add-to-cart modal need. Cost prices are left out here
// and stripped again before the response.
const PURCHASED_PRODUCT_SELECT = {
  id: true,
  name: true,
  name_ka: true,
  price: true,
  sale_price: true,
  stock: true,
  in_storage_stock: true,
  category: { select: { name: true, name_ka: true } },
  media: { orderBy: MEDIA_ORDER_BY, take: 1 },
  variant_types: {
    orderBy: { created_at: 'asc' },
    include: {
      options: {
        orderBy: { created_at: 'asc' },
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

/** One page of the user's purchased products, ready to strip and serialise. */
export async function loadPurchasedProductsPage(
  userId: string,
  cursor: PurchasedCursor | null,
  pageSize: number = PURCHASED_PAGE_SIZE
) {
  const rows = await findPurchasedRows(userId, cursor, pageSize + 1);
  const hasMore = rows.length > pageSize;
  const pageRows = hasMore ? rows.slice(0, pageSize) : rows;

  const productIds = [...new Set(pageRows.map((r) => r.product_id))];
  const products = productIds.length
    ? await prisma.products.findMany({
        where: { AND: [{ id: { in: productIds } }, PUBLIC_PRODUCT_WHERE] },
        select: PURCHASED_PRODUCT_SELECT,
      })
    : [];
  const productById = new Map(products.map((p) => [p.id, p]));

  const items = pageRows.flatMap((row) => {
    const product = productById.get(row.product_id);
    if (!product) return [];
    return [
      {
        key: `${row.product_id}:${row.variant_key}`,
        product_id: row.product_id,
        variant_option_id: row.variant_option_id,
        total_quantity: row.total_quantity,
        last_delivered_at: new Date(Number(row.last_delivered_ms)).toISOString(),
        product,
      },
    ];
  });

  // The cursor comes from the last SQL row, not the last item kept, so a
  // product dropped at hydration doesn't shift the next page.
  const last = pageRows[pageRows.length - 1];
  const next_cursor =
    hasMore && last
      ? encodeCursor({
          q: last.total_quantity,
          d: Number(last.last_delivered_ms),
          p: last.product_id,
          v: last.variant_key,
        })
      : null;

  return { items, next_cursor };
}
