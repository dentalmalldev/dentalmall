import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib';

type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc';

const SORT_ORDER: Record<SortKey, Prisma.productsOrderByWithRelationInput> = {
  newest: { created_at: 'desc' },
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' },
  name_asc: { name: 'asc' },
  name_desc: { name: 'desc' },
};

// Build the where-clause from the request's filter params (price, brand, vendor,
// availability, on-sale, has-variants, search, category).
function buildProductsWhere(searchParams: URLSearchParams): Prisma.productsWhereInput {
  const category_id = searchParams.get('category_id');
  const category_slug = searchParams.get('category_slug');
  const vendor_id = searchParams.get('vendor_id');
  const search = searchParams.get('search');
  const brands = searchParams.getAll('brand').filter(Boolean);
  const vendors = searchParams.getAll('vendor').filter(Boolean);
  const availability = searchParams.get('availability'); // 'in_stock' | 'preorder'
  const onSale = searchParams.get('onSale') === 'true';
  const hasVariants = searchParams.get('hasVariants') === 'true';

  const minPriceRaw = searchParams.get('minPrice');
  const maxPriceRaw = searchParams.get('maxPrice');
  const minPrice = minPriceRaw !== null && minPriceRaw !== '' ? parseFloat(minPriceRaw) : undefined;
  const maxPrice = maxPriceRaw !== null && maxPriceRaw !== '' ? parseFloat(maxPriceRaw) : undefined;

  const and: Prisma.productsWhereInput[] = [];

  if (category_id) and.push({ category_id });
  else if (category_slug) and.push({ category: { slug: category_slug } });

  // Single vendor (vendor pages) and/or multi-vendor filter (shop).
  if (vendor_id) and.push({ vendor_id });
  if (vendors.length > 0) and.push({ vendor_id: { in: vendors } });

  // Brand / manufacturer multi-select (OR within the filter).
  if (brands.length > 0) and.push({ manufacturer: { in: brands } });

  if (availability === 'in_stock') and.push({ in_storage_stock: true });
  else if (availability === 'preorder') and.push({ in_storage_stock: false });

  // On sale = a sale price set AND strictly below the regular price (field reference).
  if (onSale) {
    and.push({ sale_price: { not: null } });
    and.push({ sale_price: { lt: prisma.products.fields.price } });
  }

  if (hasVariants) {
    and.push({ variant_types: { some: { options: { some: {} } } } });
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    and.push({
      price: {
        ...(minPrice !== undefined ? { gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
      },
    });
  }

  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { name_ka: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { category: { name: { contains: search, mode: 'insensitive' } } },
        { category: { name_ka: { contains: search, mode: 'insensitive' } } },
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const skip = (page - 1) * limit;
  const sort = (searchParams.get('sort') as SortKey) || 'newest';
  const orderBy = SORT_ORDER[sort] ?? SORT_ORDER.newest;

  const where = buildProductsWhere(searchParams);

  const [products, total] = await Promise.all([
    prisma.products.findMany({
      where,
      include: {
        category: true,
        media: true,
        vendor: true,
        variant_types: { include: { options: true } },
      },
      skip,
      take: limit,
      orderBy,
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
