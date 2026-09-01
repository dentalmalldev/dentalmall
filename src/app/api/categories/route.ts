import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib';
import { PUBLIC_PRODUCT_WHERE } from '@/lib/vendors/visibility';

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

  // Return hierarchical structure with per-category product counts so the UI
  // can disable subcategories that have no products. Products of buffered
  // (unpublished) stores are excluded so the counts match what the shop shows.
  const publicProducts = { where: PUBLIC_PRODUCT_WHERE };
  const categories = await prisma.categories.findMany({
    where: { parent_id: null },
    include: {
      children: {
        include: {
          children: { include: { _count: { select: { products: publicProducts } } } },
          _count: { select: { products: publicProducts } },
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
