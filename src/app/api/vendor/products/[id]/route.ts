import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { prisma } from '@/lib';
import { vendorUpdateProductPricingSchema } from '@/lib/validations/vendor-product';
import { MEDIA_ORDER_BY } from '@/lib/products/mediaOrder';

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
        include: { variant_types: true },
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

      const { dentalmall_price, variant_options } = validation.data;

      // Vendors only set what DentalMall buys at (dentalmall_price); the selling
      // price and sale price are admin-only.
      const updateData: Record<string, unknown> = {};
      if (dentalmall_price !== undefined) updateData.dentalmall_price = dentalmall_price;

      // Update product pricing in a transaction
      const updatedProduct = await prisma.$transaction(async (tx) => {
        // Update product pricing
        if (Object.keys(updateData).length > 0) {
          await tx.products.update({
            where: { id },
            data: updateData,
          });
        }

        // Same rule per option: vendor cost only.
        if (variant_options && variant_options.length > 0) {
          for (const o of variant_options) {
            if (o.dentalmall_price !== undefined) {
              await tx.variant_options.update({
                where: { id: o.id },
                data: { dentalmall_price: o.dentalmall_price },
              });
            }
          }
        }

        return tx.products.findUnique({
          where: { id },
          include: {
            category: { select: { id: true, name: true, name_ka: true } },
            vendor: { select: { id: true, company_name: true } },
            media: { orderBy: MEDIA_ORDER_BY },
            variant_types: { include: { options: true } },
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
