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
