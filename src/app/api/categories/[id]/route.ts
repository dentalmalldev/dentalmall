import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib';

type Params = Promise<{ id: string }>;

export async function GET(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;

  const category = await prisma.categories.findUnique({
    where: { id },
    include: {
      children: true,
      products: true,
    },
  });

  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  return NextResponse.json(category);
}

export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const body = await request.json();

  const category = await prisma.categories.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(category);
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const { id } = await params;

  await prisma.categories.delete({
    where: { id },
  });

  return NextResponse.json({ message: 'Category deleted' });
}
