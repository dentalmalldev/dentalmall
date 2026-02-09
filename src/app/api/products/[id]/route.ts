import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib';

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
        },
      },
      media: true,
      variants: true,
    },
  });

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json(product);
}

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const body = await request.json();
  const { variants, ...productData } = body;

  const product = await prisma.$transaction(async (tx) => {
    const updated = await tx.products.update({
      where: { id },
      data: productData,
    });

    if (variants !== undefined) {
      // Delete variants not in the update list
      const keepIds = variants
        .filter((v: { id?: string }) => v.id)
        .map((v: { id: string }) => v.id);

      await tx.product_variants.deleteMany({
        where: { product_id: id, id: { notIn: keepIds } },
      });

      // Upsert each variant
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
              name: v.name,
              name_ka: v.name_ka,
              price: v.price,
              sale_price: v.sale_price || null,
              discount_percent: v.discount_percent || null,
              stock: v.stock,
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
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;

  await prisma.products.delete({
    where: { id },
  });

  return NextResponse.json({ message: 'Product deleted' });
}
