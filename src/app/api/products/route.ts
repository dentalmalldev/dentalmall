import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category_id = searchParams.get('category_id');
  const category_slug = searchParams.get('category_slug');
  const vendor_id = searchParams.get('vendor_id');
  const search = searchParams.get('search');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  if (category_id) {
    where.category_id = category_id;
  } else if (category_slug) {
    where.category = { slug: category_slug };
  }

  if (vendor_id) {
    where.vendor_id = vendor_id;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { name_ka: { contains: search, mode: 'insensitive' } },
      { manufacturer: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
      { category: { name: { contains: search, mode: 'insensitive' } } },
      { category: { name_ka: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where,
      include: { category: true, media: true, vendor: true, variants: true },
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
    prisma.products.count({ where }),
  ]);

  return NextResponse.json({
    data: products,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const product = await prisma.products.create({
    data: body,
    include: { category: true },
  });

  return NextResponse.json(product, { status: 201 });
}
