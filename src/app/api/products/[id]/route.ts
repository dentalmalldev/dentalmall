import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib';
import { isProductHidden } from '@/lib/vendors/visibility';
import { MEDIA_ORDER_BY } from '@/lib/products/mediaOrder';
import { stripCostPrices } from '@/lib/products/publicPricing';

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;

  const product = await prisma.products.findUnique({
    where: { id },
    include: {
      category: {
        include: { parent: true },
      },
      vendor: {
        select: {
          id: true,
          company_name: true,
          city: true,
          is_published: true,
        },
      },
      media: { orderBy: MEDIA_ORDER_BY },
      variant_types: { include: { options: true } },
    },
  });

  // A product of a store still in the buffer is treated as non-existent publicly.
  if (!product || isProductHidden(product)) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json(stripCostPrices(product));
}
