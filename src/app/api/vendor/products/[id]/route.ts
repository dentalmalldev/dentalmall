import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';
import { vendorUpdateProductPricingSchema } from '@/lib/validations/vendor-product';

type Params = Promise<{ id: string }>;

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;

  return withAuth(request, async (req, authUser) => {
    try {
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user || user.role !== 'VENDOR') {
        return NextResponse.json(
          { error: 'Access denied. Vendor privileges required.' },
          { status: 403 }
        );
      }

      // Get product and verify it belongs to the user's vendor
      const product = await prisma.products.findUnique({
        where: { id },
        include: { variants: true },
      });

      if (!product || !product.vendor_id) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      const userVendors = await prisma.vendors.findMany({
        where: { user_id: user.id },
        select: { id: true },
      });

      const vendorIds = userVendors.map((v) => v.id);

      if (!vendorIds.includes(product.vendor_id)) {
        return NextResponse.json(
          { error: 'Access denied. This product does not belong to your vendor.' },
          { status: 403 }
        );
      }

      const body = await req.json();
      const validation = vendorUpdateProductPricingSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: validation.error },
          { status: 400 }
        );
      }

      const { price, sale_price, discount_percent, variants } = validation.data;

      // Build product update data (only pricing fields)
      const updateData: Record<string, unknown> = {};
      if (price !== undefined) updateData.price = price;
      if (sale_price !== undefined) updateData.sale_price = sale_price;
      if (discount_percent !== undefined) updateData.discount_percent = discount_percent;

      // Update product pricing in a transaction
      const updatedProduct = await prisma.$transaction(async (tx) => {
        // Update product pricing
        if (Object.keys(updateData).length > 0) {
          await tx.products.update({
            where: { id },
            data: updateData,
          });
        }

        // Update variant pricing if provided
        if (variants && variants.length > 0) {
          for (const v of variants) {
            const variantUpdate: Record<string, unknown> = {};
            if (v.price !== undefined) variantUpdate.price = v.price;
            if (v.sale_price !== undefined) variantUpdate.sale_price = v.sale_price;
            if (v.discount_percent !== undefined) variantUpdate.discount_percent = v.discount_percent;

            if (Object.keys(variantUpdate).length > 0) {
              await tx.product_variants.update({
                where: { id: v.id, product_id: id },
                data: variantUpdate,
              });
            }
          }
        }

        return tx.products.findUnique({
          where: { id },
          include: {
            category: { select: { id: true, name: true, name_ka: true } },
            vendor: { select: { id: true, company_name: true } },
            media: true,
            variants: true,
          },
        });
      });

      return NextResponse.json(updatedProduct);
    } catch (error) {
      console.error('Error updating product pricing:', error);
      return NextResponse.json(
        { error: 'Failed to update product pricing' },
        { status: 500 }
      );
    }
  });
}
