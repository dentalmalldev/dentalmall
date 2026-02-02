import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib';

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;

  const product = await prisma.products.findUnique({
    where: { id },
    include: {
      category: true,
      vendor: {
        select: {
          id: true,
          company_name: true,
          city: true,
        },
      },
      media: true,
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

  const product = await prisma.products.update({
    where: { id },
    data: body,
    include: { category: true },
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
