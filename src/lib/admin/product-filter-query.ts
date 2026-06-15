import { Prisma } from '@prisma/client';
import { prisma } from '@/lib';
import { AdminProductFilter, parseAdminProductFilter } from '@/lib/validations/product-filter';
import { BulkTarget } from '@/lib/validations/bulkEditProducts';

/**
 * Build the Prisma where-clause for the admin product list from a parsed filter.
 * Shared by the list endpoint and the bulk-edit / bulk-delete endpoints so that
 * "select all matching filters" targets exactly the rows the admin is viewing.
 */
export async function buildAdminProductWhere(
  filter: AdminProductFilter
): Promise<Prisma.productsWhereInput> {
  const { search, category, subcategory, vendor, minPrice, maxPrice } = filter;
  const where: Prisma.productsWhereInput = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { name_ka: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (subcategory) {
    where.category_id = subcategory;
  } else if (category) {
    const children = await prisma.categories.findMany({
      where: { parent_id: category },
      select: { id: true },
    });
    where.category_id = { in: [category, ...children.map((c) => c.id)] };
  }

  if (vendor.length > 0) {
    where.vendor_id = { in: vendor };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined ? { gte: minPrice } : {}),
      ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
    };
  }

  return where;
}

/**
 * Resolve a bulk-action target into a concrete list of product ids.
 * "ids" mode uses the explicit list; "filters" mode re-runs the active filter
 * query server-side (so selecting thousands never ships a huge id payload).
 */
export async function resolveBulkTargetIds(target: BulkTarget): Promise<string[]> {
  if (target.mode === 'ids') return target.ids;

  const filter = parseAdminProductFilter(new URLSearchParams(target.filters));
  const where = await buildAdminProductWhere(filter);
  const rows = await prisma.products.findMany({ where, select: { id: true } });
  return rows.map((r) => r.id);
}
