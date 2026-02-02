import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const flat = searchParams.get('flat') === 'true';

  if (flat) {
    // Return flat list of all categories (useful for dropdowns)
    const categories = await prisma.categories.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(categories);
  }

  // Return hierarchical structure
  const categories = await prisma.categories.findMany({
    where: { parent_id: null },
    include: {
      children: {
        include: {
          children: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const category = await prisma.categories.create({
    data: body,
  });

  return NextResponse.json(category, { status: 201 });
}
