import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { withAuth, prisma } from '@/lib';
import {
  bulkCommitSchema,
  type BulkProductRow,
} from '@/lib/validations/bulkProductUpload';

export interface CommitRowResult {
  rowNumber: number;
  status: 'created' | 'skipped' | 'failed';
  productId?: string;
  error?: string;
}

export interface CommitResponse {
  results: CommitRowResult[];
  summary: {
    created: number;
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
      const [existingProducts, existingVariants] = await Promise.all([
        prisma.products.findMany({ select: { sku: true } }),
        prisma.variant_options.findMany({ select: { sku: true } }),
      ]);
      const usedProductSkus = new Set(existingProducts.map((p) => p.sku));
      const usedVariantSkus = new Set(existingVariants.map((v) => v.sku));

      const results: CommitRowResult[] = [];
      // Abort-on-error: bail at the first failure (no further rows processed; prior rows STAY committed).
      // Skip-invalid: continue past failures.
      for (const row of rows) {
        try {
          const productId = await createSingleProduct(row, usedProductSkus, usedVariantSkus);
          results.push({ rowNumber: row.rowNumber, status: 'created', productId });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          if (mode === 'abort-on-error') {
            results.push({ rowNumber: row.rowNumber, status: 'failed', error: message });
            break;
          }
          results.push({ rowNumber: row.rowNumber, status: 'failed', error: message });
        }
      }

      // Any row never processed (because abort fired) becomes "skipped"
      const processed = new Set(results.map((r) => r.rowNumber));
      for (const row of rows) {
        if (!processed.has(row.rowNumber)) {
          results.push({ rowNumber: row.rowNumber, status: 'skipped' });
        }
      }

      const response: CommitResponse = {
        results,
        summary: {
          created: results.filter((r) => r.status === 'created').length,
          skipped: results.filter((r) => r.status === 'skipped').length,
          failed: results.filter((r) => r.status === 'failed').length,
        },
      };

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
  usedVariantSkus: Set<string>
): Promise<string> {
  const baseSku = row.sku ? generateUniqueSku(row.sku, usedProductSkus) : fallbackSku(row.name_en, usedProductSkus);
  const hasVariants = row.variant_options.length > 0;

  // Mirror the admin-form rule: when variants drive pricing, base price = lowest variant final price.
  const lowestVariantPrice = hasVariants
    ? Math.min(
        ...row.variant_options.map((o) => o.dentalmall_price)
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
        manufacturer: row.manufacturer,
        sku: baseSku,
        price: basePrice,
        sale_price: null,
        discount_percent: null,
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
                          // Vendor cost: we don't have a per-option vendor price column in the template,
                          // so we mirror the dentalmall_price into both columns. Admin can adjust later.
                          price: o.dentalmall_price,
                          dentalmall_price: o.dentalmall_price,
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
