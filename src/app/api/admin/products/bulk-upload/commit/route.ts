import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { withAuth, prisma } from '@/lib';
import {
  bulkCommitSchema,
  type BulkProductRow,
} from '@/lib/validations/bulkProductUpload';
import { createManufacturerResolver } from '@/lib/products/normalizeManufacturer';

type ManufacturerResolver = ReturnType<typeof createManufacturerResolver>;

export interface CommitRowResult {
  rowNumber: number;
  status: 'created' | 'updated' | 'unchanged' | 'skipped' | 'failed';
  productId?: string;
  error?: string;
}

export interface CommitResponse {
  results: CommitRowResult[];
  summary: {
    created: number;
    updated: number;
    unchanged: number;
    skipped: number;
    failed: number;
  };
}

function generateUniqueSku(base: string, used: Set<string>) {
  // Match the suffix style we used in the variant-options migration: 8-char tail.
  let candidate = base;
  while (used.has(candidate)) {
    candidate = `${base}-${randomBytes(4).toString('hex')}`;
  }
  used.add(candidate);
  return candidate;
}

function fallbackSku(name: string, used: Set<string>) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'product';
  return generateUniqueSku(slug, used);
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const adminUser = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });
      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        );
      }

      const body = await req.json();
      const parsed = bulkCommitSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid payload', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const { rows, mode } = parsed.data;

      // Snapshot the SKUs already in the DB so we don't generate collisions during this batch.
      const [existingProducts, existingVariants, existingManufacturers] = await Promise.all([
        prisma.products.findMany({ select: { sku: true } }),
        prisma.variant_options.findMany({ select: { sku: true } }),
        prisma.products.findMany({
          where: { manufacturer: { not: null } },
          select: { manufacturer: true },
          distinct: ['manufacturer'],
        }),
      ]);
      const usedProductSkus = new Set(existingProducts.map((p) => p.sku));
      const usedVariantSkus = new Set(existingVariants.map((v) => v.sku));
      // Case-insensitive brand normalization, shared across all rows in this batch.
      const resolveManufacturer = createManufacturerResolver(
        existingManufacturers.map((p) => p.manufacturer)
      );

      const results: CommitRowResult[] = [];
      // Abort-on-error: bail at the first failure (no further rows processed; prior rows STAY committed).
      // Skip-invalid: continue past failures.
      let aborted = false;
      for (const row of rows) {
        try {
          if (row.status === 'unchanged') {
            // Exact match — no write.
            results.push({ rowNumber: row.rowNumber, status: 'unchanged' });
          } else if (row.status === 'update' && row.existing_product_id) {
            const productId = await updateExistingProduct(row, usedVariantSkus, resolveManufacturer);
            results.push({ rowNumber: row.rowNumber, status: 'updated', productId });
          } else {
            const productId = await createSingleProduct(row, usedProductSkus, usedVariantSkus, resolveManufacturer);
            results.push({ rowNumber: row.rowNumber, status: 'created', productId });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          results.push({ rowNumber: row.rowNumber, status: 'failed', error: message });
          if (mode === 'abort-on-error') {
            aborted = true;
            break;
          }
        }
      }

      // Any row never processed (because abort fired) becomes "skipped"
      if (aborted) {
        const processed = new Set(results.map((r) => r.rowNumber));
        for (const row of rows) {
          if (!processed.has(row.rowNumber)) {
            results.push({ rowNumber: row.rowNumber, status: 'skipped' });
          }
        }
      }

      const count = (s: CommitRowResult['status']) => results.filter((r) => r.status === s).length;
      const response: CommitResponse = {
        results,
        summary: {
          created: count('created'),
          updated: count('updated'),
          unchanged: count('unchanged'),
          skipped: count('skipped'),
          failed: count('failed'),
        },
      };

      // Audit log — total created / updated / skipped for this upload.
      await prisma.admin_action_logs.create({
        data: {
          admin_id: adminUser.id,
          action: 'BULK_UPLOAD_PRODUCTS',
          details: JSON.stringify({
            created: response.summary.created,
            updated: response.summary.updated,
            unchanged: response.summary.unchanged,
            skipped: response.summary.skipped,
            failed: response.summary.failed,
          }),
        },
      });

      return NextResponse.json(response);
    } catch (error) {
      console.error('Bulk-upload commit error:', error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to commit upload' },
        { status: 500 }
      );
    }
  });
}

async function createSingleProduct(
  row: BulkProductRow,
  usedProductSkus: Set<string>,
  usedVariantSkus: Set<string>,
  resolveManufacturer: ManufacturerResolver
): Promise<string> {
  const baseSku = row.sku ? generateUniqueSku(row.sku, usedProductSkus) : fallbackSku(row.name_en, usedProductSkus);
  const hasVariants = row.variant_options.length > 0;

  // Mirror the admin-form rule: when variants drive pricing, base price = lowest variant final price.
  const lowestVariantPrice = hasVariants
    ? Math.min(
        ...row.variant_options.map((o) => o.price)
      )
    : null;
  const basePrice = hasVariants ? lowestVariantPrice! : (row.price ?? 0);

  return prisma.$transaction(async (tx) => {
    const product = await tx.products.create({
      data: {
        name: row.name_en,
        name_ka: row.name_ka || row.name_en,
        description: row.description_en,
        description_ka: row.description_ka || row.description_en,
        manufacturer: resolveManufacturer(row.manufacturer),
        sku: baseSku,
        price: basePrice,
        // Cost is per option when variants exist; the product-level one is only
        // meaningful for plain products.
        dentalmall_price: hasVariants ? null : row.dentalmall_price,
        sale_price: null,
        discount_percent: null,
        unit: row.unit?.trim() || null,
        stock: row.quantity,
        // Honour the parser-derived flag; fall back to quantity-based derivation if absent.
        in_storage_stock: row.in_storage_stock ?? row.quantity > 0,
        category_id: row.category_id,
        vendor_id: row.vendor_id,
        ...(hasVariants
          ? {
              variant_types: {
                create: [
                  {
                    name: row.variant_type_en || 'Variant',
                    name_ka: row.variant_type_ka || row.variant_type_en || 'Variant',
                    options: {
                      create: row.variant_options.map((o, idx) => {
                        const optSku = o.sku
                          ? generateUniqueSku(o.sku, usedVariantSkus)
                          : generateUniqueSku(`${baseSku}-opt${idx + 1}`, usedVariantSkus);
                        return {
                          name: o.name_en,
                          name_ka: o.name_ka || o.name_en,
                          sku: optSku,
                          price: o.price,
                          // No cost given → assume no margin until an admin fills it in.
                          dentalmall_price: o.dentalmall_price ?? o.price,
                          sale_price: null,
                          stock: o.quantity ?? 0,
                        };
                      }),
                    },
                  },
                ],
              },
            }
          : {}),
      },
      select: { id: true },
    });
    return product.id;
  });
}

/**
 * Update an existing product (matched by SKU). Non-destructive:
 *  - empty Excel cells are omitted (never clear a value); stock always overwrites
 *  - images are never touched (not in the template)
 *  - variants matched by their own SKU: existing → updated, new → added,
 *    missing (in DB but not in Excel) → kept
 */
async function updateExistingProduct(
  row: BulkProductRow,
  usedVariantSkus: Set<string>,
  resolveManufacturer: ManufacturerResolver
): Promise<string> {
  const productId = row.existing_product_id!;
  const hasVariants = row.variant_options.length > 0;
  const newStock = row.quantity ?? 0;

  return prisma.$transaction(
    async (tx) => {
      const product = await tx.products.findUnique({
        where: { id: productId },
        select: {
          id: true,
          variant_types: { select: { id: true, options: { select: { id: true, sku: true } } } },
        },
      });
      if (!product) throw new Error('Product to update not found');

      const data: Prisma.productsUpdateInput = {
        name: row.name_en,
        description: row.description_en,
        stock: newStock,
        in_storage_stock: newStock > 0,
        category: { connect: { id: row.category_id } },
      };
      if (row.name_ka.trim()) data.name_ka = row.name_ka;
      if (row.description_ka.trim()) data.description_ka = row.description_ka;
      if (row.manufacturer && row.manufacturer.trim()) data.manufacturer = resolveManufacturer(row.manufacturer);
      if (row.unit && row.unit.trim()) data.unit = row.unit.trim();
      if (row.vendor_id) data.vendor = { connect: { id: row.vendor_id } };
      // Non-variant products carry the prices directly; variant products derive them below.
      if (!hasVariants && row.price !== null) data.price = row.price;
      if (!hasVariants && row.dentalmall_price !== null) data.dentalmall_price = row.dentalmall_price;

      await tx.products.update({ where: { id: productId }, data });

      if (hasVariants) {
        // Ensure a variant type exists to attach new options to.
        let variantTypeId = product.variant_types[0]?.id;
        if (!variantTypeId) {
          const vt = await tx.variant_types.create({
            data: {
              product_id: productId,
              name: row.variant_type_en || 'Variant',
              name_ka: row.variant_type_ka || row.variant_type_en || 'Variant',
            },
          });
          variantTypeId = vt.id;
        }

        const existingBySku = new Map(
          product.variant_types.flatMap((vt) => vt.options).map((o) => [o.sku, o.id])
        );

        for (const [idx, o] of row.variant_options.entries()) {
          const existingId = o.sku ? existingBySku.get(o.sku) : undefined;
          if (existingId) {
            await tx.variant_options.update({
              where: { id: existingId },
              data: {
                name: o.name_en,
                name_ka: o.name_ka || o.name_en,
                price: o.price,
                // Empty cost cell leaves the stored cost alone.
                ...(o.dentalmall_price !== null ? { dentalmall_price: o.dentalmall_price } : {}),
                stock: o.quantity ?? 0,
              },
            });
          } else {
            const optSku = o.sku
              ? generateUniqueSku(o.sku, usedVariantSkus)
              : generateUniqueSku(`${row.sku || 'opt'}-opt${idx + 1}`, usedVariantSkus);
            await tx.variant_options.create({
              data: {
                variant_type_id: variantTypeId,
                name: o.name_en,
                name_ka: o.name_ka || o.name_en,
                sku: optSku,
                price: o.price,
                dentalmall_price: o.dentalmall_price ?? o.price,
                sale_price: null,
                stock: o.quantity ?? 0,
              },
            });
          }
        }

        // Keep the product base price in sync with the lowest option selling price.
        const allOptions = await tx.variant_options.findMany({
          where: { variant_type: { product_id: productId } },
          select: { price: true },
        });
        if (allOptions.length > 0) {
          const min = Math.min(...allOptions.map((o) => Number(o.price)));
          await tx.products.update({ where: { id: productId }, data: { price: min } });
        }
      }

      return productId;
    },
    { timeout: 30000 }
  );
}
