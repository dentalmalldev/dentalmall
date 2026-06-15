import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { withAuth, prisma } from '@/lib';
import { bulkEditSchema } from '@/lib/validations/bulkEditProducts';
import { resolveBulkTargetIds } from '@/lib/admin/product-filter-query';

// Guard against runaway transactions; the UI warns when exceeding this.
const MAX_BULK_PRODUCTS = 1000;

export async function PATCH(request: NextRequest) {
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

      const parsed = bulkEditSchema.safeParse(await req.json());
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten() },
          { status: 400 }
        );
      }
      const { target, fields } = parsed.data;

      // Validate category reassignment up-front (subcategory must resolve to a real row).
      if (fields.category_id) {
        const category = await prisma.categories.findUnique({ where: { id: fields.category_id } });
        if (!category) {
          return NextResponse.json({ error: 'Target category not found' }, { status: 400 });
        }
      }
      if (fields.vendor_id) {
        const vendor = await prisma.vendors.findUnique({ where: { id: fields.vendor_id } });
        if (!vendor || !vendor.is_active) {
          return NextResponse.json({ error: 'Invalid or inactive vendor' }, { status: 400 });
        }
      }

      const ids = await resolveBulkTargetIds(target);
      if (ids.length === 0) {
        return NextResponse.json({ error: 'No products matched the selection' }, { status: 400 });
      }
      if (ids.length > MAX_BULK_PRODUCTS) {
        return NextResponse.json(
          { error: `Selection too large (${ids.length}). Narrow the filters to ≤ ${MAX_BULK_PRODUCTS}.` },
          { status: 400 }
        );
      }

      // Load current values needed for fill_empty decisions + media presence.
      const products = await prisma.products.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          description: true,
          description_ka: true,
          stock: true,
          _count: { select: { media: true } },
        },
      });

      // Shared scalar update for every product (fields that don't depend on current value).
      const sharedData: Prisma.productsUpdateInput = {};
      if (fields.price !== undefined) sharedData.price = fields.price;
      if (fields.sale_price !== undefined) sharedData.sale_price = fields.sale_price;
      if (fields.manufacturer !== undefined) sharedData.manufacturer = fields.manufacturer;
      if (fields.in_storage_stock !== undefined) sharedData.in_storage_stock = fields.in_storage_stock;
      if (fields.category_id !== undefined) {
        sharedData.category = { connect: { id: fields.category_id } };
      }
      if (fields.vendor_id !== undefined) {
        sharedData.vendor = fields.vendor_id
          ? { connect: { id: fields.vendor_id } }
          : { disconnect: true };
      }

      // Single transaction — any row failing rolls back the whole batch.
      await prisma.$transaction(
        async (tx) => {
          for (const product of products) {
            const data: Prisma.productsUpdateInput = { ...sharedData };

            if (fields.stock) {
              data.stock =
                fields.stock.mode === 'set'
                  ? Math.max(0, fields.stock.value)
                  : Math.max(0, product.stock + fields.stock.value);
            }

            if (fields.description) {
              const empty = !product.description || product.description.trim() === '';
              if (fields.description.mode === 'replace' || empty) {
                data.description = fields.description.value;
              }
            }
            if (fields.description_ka) {
              const empty = !product.description_ka || product.description_ka.trim() === '';
              if (fields.description_ka.mode === 'replace' || empty) {
                data.description_ka = fields.description_ka.value;
              }
            }

            if (Object.keys(data).length > 0) {
              await tx.products.update({ where: { id: product.id }, data });
            }

            // Image: replace (swap existing) or fill_empty (only when no media yet).
            if (fields.image) {
              const hasMedia = product._count.media > 0;
              if (fields.image.mode === 'replace') {
                await tx.media.deleteMany({ where: { product_id: product.id } });
              }
              if (fields.image.mode === 'replace' || !hasMedia) {
                await tx.media.create({
                  data: {
                    url: fields.image.url,
                    filename: fields.image.filename,
                    original_name: fields.image.original_name,
                    type: 'image',
                    size: fields.image.size ?? null,
                    product_id: product.id,
                  },
                });
              }
            }
          }
        },
        { timeout: 60_000, maxWait: 10_000 }
      );

      // Audit log — granular enough to support a future undo ticket.
      await prisma.admin_action_logs.create({
        data: {
          admin_id: adminUser.id,
          action: 'BULK_EDIT_PRODUCTS',
          details: JSON.stringify({
            count: products.length,
            fields: Object.keys(fields),
            product_ids: products.map((p) => p.id),
          }),
        },
      });

      return NextResponse.json({ updated: products.length });
    } catch (error) {
      console.error('Bulk edit error:', error);
      return NextResponse.json({ error: 'Failed to apply bulk edit' }, { status: 500 });
    }
  });
}
