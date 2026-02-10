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
      variant_types: { include: { options: true } },
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
  const { variant_types, ...productData } = body;

  const product = await prisma.$transaction(async (tx) => {
    await tx.products.update({
      where: { id },
      data: productData,
    });

    if (variant_types !== undefined) {
      const keepTypeIds = variant_types
        .filter((vt: { id?: string }) => vt.id)
        .map((vt: { id: string }) => vt.id);

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

        const keepOptionIds = (vt.options || [])
          .filter((o: { id?: string }) => o.id)
          .map((o: { id: string }) => o.id);

        await tx.variant_options.deleteMany({
          where: { variant_type_id: typeId, id: { notIn: keepOptionIds } },
        });

        for (const o of vt.options || []) {
          if (o.id) {
            await tx.variant_options.update({
              where: { id: o.id },
              data: {
                name: o.name,
                name_ka: o.name_ka,
                price: o.price,
                sale_price: o.sale_price || null,
                discount_percent: o.discount_percent || null,
                stock: o.stock,
              },
            });
          } else {
            await tx.variant_options.create({
              data: {
                variant_type_id: typeId,
                name: o.name,
                name_ka: o.name_ka,
                price: o.price,
                sale_price: o.sale_price || null,
                discount_percent: o.discount_percent || null,
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
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;

  await prisma.products.delete({
    where: { id },
  });

  return NextResponse.json({ message: 'Product deleted' });
}
