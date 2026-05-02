import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { withAuth, prisma } from '@/lib';
import { updateProductSchema } from '@/lib/validations/product';

type Params = Promise<{ id: string }>;

// PUT - Update a product (admin only)
export async function PUT(request: NextRequest, { params }: { params: Params }) {
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

      const { id } = await params;
      const body = await req.json();
      const validationResult = updateProductSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validationResult.error },
          { status: 400 }
        );
      }

      const existing = await prisma.products.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      const data = validationResult.data;
      const { variant_types, ...productData } = data;

      // Check SKU uniqueness if changed
      if (productData.sku && productData.sku !== existing.sku) {
        const skuExists = await prisma.products.findFirst({
          where: { sku: productData.sku, id: { not: id } },
        });
        if (skuExists) {
          return NextResponse.json(
            { error: 'Product with this SKU already exists' },
            { status: 400 }
          );
        }
      }

      // Validate variant SKUs: in-payload uniqueness + cross-record collisions
      const variantSkus = (variant_types ?? []).flatMap((vt) =>
        vt.options.map((o) => ({ id: o.id, sku: o.sku }))
      );
      if (variantSkus.length > 0) {
        const seen = new Set<string>();
        for (const v of variantSkus) {
          if (seen.has(v.sku)) {
            return NextResponse.json(
              { error: 'Variant SKUs must be unique within the product' },
              { status: 400 }
            );
          }
          seen.add(v.sku);
        }
        const otherVariantHits = await prisma.variant_options.findMany({
          where: {
            sku: { in: variantSkus.map((v) => v.sku) },
            id: { notIn: variantSkus.filter((v) => v.id).map((v) => v.id as string) },
          },
          select: { sku: true },
        });
        const productHits = await prisma.products.findMany({
          where: { sku: { in: variantSkus.map((v) => v.sku) }, id: { not: id } },
          select: { sku: true },
        });
        const conflictSku = otherVariantHits[0]?.sku || productHits[0]?.sku;
        if (conflictSku) {
          return NextResponse.json(
            { error: `SKU "${conflictSku}" is already in use` },
            { status: 400 }
          );
        }
      }

      // Check vendor if changed
      if (productData.vendor_id) {
        const vendor = await prisma.vendors.findUnique({
          where: { id: productData.vendor_id },
        });
        if (!vendor || !vendor.is_active) {
          return NextResponse.json(
            { error: 'Invalid or inactive vendor' },
            { status: 400 }
          );
        }
      }

      // Check category if changed
      if (productData.category_id) {
        const category = await prisma.categories.findUnique({
          where: { id: productData.category_id },
        });
        if (!category) {
          return NextResponse.json({ error: 'Category not found' }, { status: 400 });
        }
      }

      const product = await prisma.$transaction(async (tx) => {
        await tx.products.update({
          where: { id },
          data: {
            ...productData,
            vendor_id: productData.vendor_id || null,
            sale_price: productData.sale_price || null,
            discount_percent: productData.discount_percent || null,
          },
        });

        if (variant_types !== undefined) {
          const keepTypeIds = variant_types
            .filter((vt): vt is typeof vt & { id: string } => !!vt.id)
            .map((vt) => vt.id);

          // Delete removed variant types (cascades to options)
          await tx.variant_types.deleteMany({
            where: { product_id: id, id: { notIn: keepTypeIds } },
          });

          for (const vt of variant_types) {
            let typeId: string;

            if (vt.id) {
              await tx.variant_types.update({
                where: { id: vt.id },
                data: { name: vt.name, name_ka: vt.name_ka },
              });
              typeId = vt.id;
            } else {
              const created = await tx.variant_types.create({
                data: { product_id: id, name: vt.name, name_ka: vt.name_ka },
              });
              typeId = created.id;
            }

            const keepOptionIds = vt.options
              .filter((o): o is typeof o & { id: string } => !!o.id)
              .map((o) => o.id);

            await tx.variant_options.deleteMany({
              where: { variant_type_id: typeId, id: { notIn: keepOptionIds } },
            });

            for (const o of vt.options) {
              if (o.id) {
                await tx.variant_options.update({
                  where: { id: o.id },
                  data: {
                    name: o.name,
                    name_ka: o.name_ka,
                    sku: o.sku,
                    price: o.price,
                    dentalmall_price: o.dentalmall_price,
                    sale_price: o.sale_price || null,
                    stock: o.stock,
                  },
                });
              } else {
                await tx.variant_options.create({
                  data: {
                    variant_type_id: typeId,
                    name: o.name,
                    name_ka: o.name_ka,
                    sku: o.sku,
                    price: o.price,
                    dentalmall_price: o.dentalmall_price,
                    sale_price: o.sale_price || null,
                    stock: o.stock ?? 0,
                  },
                });
              }
            }
          }
        }

        return tx.products.findUnique({
          where: { id },
          include: {
            category: true,
            vendor: true,
            media: true,
            variant_types: { include: { options: true } },
          },
        });
      });

      return NextResponse.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }
  });
}

// DELETE - Delete a product with Firebase image cleanup (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  return withAuth(request, async (_req, authUser) => {
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

      const { id } = await params;

      const product = await prisma.products.findUnique({
        where: { id },
        include: { media: true },
      });

      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      // order_items has no cascade — block deletion if the product has order history
      const orderItemCount = await prisma.order_items.count({ where: { product_id: id } });
      if (orderItemCount > 0) {
        return NextResponse.json(
          { error: 'Cannot delete product: it is referenced by existing orders. Remove or archive it instead.' },
          { status: 409 }
        );
      }

      // Delete images from Firebase Storage
      if (product.media.length > 0) {
        const { deleteFile } = await import('@/lib/firebase-storage');
        for (const media of product.media) {
          try {
            await deleteFile(media.filename, 'products');
          } catch (storageError) {
            console.error(`Error deleting file ${media.filename} from storage:`, storageError);
          }
        }
      }

      // Delete product (cascading deletes handle media, variants, cart_items)
      await prisma.products.delete({ where: { id } });

      return NextResponse.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        return NextResponse.json(
          { error: 'Cannot delete product: it is referenced by existing orders.' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }
  });
}
