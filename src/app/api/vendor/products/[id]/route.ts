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

      const { price, sale_price, discount_percent, variant_options } = validation.data;

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

        // Update variant option pricing if provided
        if (variant_options && variant_options.length > 0) {
          for (const o of variant_options) {
            const optionUpdate: Record<string, unknown> = {};
            if (o.price !== undefined) optionUpdate.price = o.price;
            if (o.sale_price !== undefined) optionUpdate.sale_price = o.sale_price;
            if (o.discount_percent !== undefined) optionUpdate.discount_percent = o.discount_percent;

            if (Object.keys(optionUpdate).length > 0) {
              await tx.variant_options.update({
                where: { id: o.id },
                data: optionUpdate,
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
