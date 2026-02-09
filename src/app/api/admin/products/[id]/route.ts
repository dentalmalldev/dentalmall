import { NextRequest, NextResponse } from 'next/server';
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
      const { variants, ...productData } = data;

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

        if (variants !== undefined) {
          const keepIds = variants
            .filter((v): v is typeof v & { id: string } => !!v.id)
            .map((v) => v.id);

          await tx.product_variants.deleteMany({
            where: { product_id: id, id: { notIn: keepIds } },
          });

          for (const v of variants) {
            if (v.id) {
              await tx.product_variants.update({
                where: { id: v.id },
                data: {
                  name: v.name,
                  name_ka: v.name_ka,
                  price: v.price,
                  sale_price: v.sale_price || null,
                  discount_percent: v.discount_percent || null,
                  stock: v.stock,
                },
              });
            } else {
              await tx.product_variants.create({
                data: {
                  product_id: id,
                  name: v.name!,
                  name_ka: v.name_ka!,
                  price: v.price!,
                  sale_price: v.sale_price || null,
                  discount_percent: v.discount_percent || null,
                  stock: v.stock ?? 0,
                },
              });
            }
          }
        }

        return tx.products.findUnique({
          where: { id },
          include: { category: true, vendor: true, media: true, variants: true },
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
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 500 }
      );
    }
  });
}
