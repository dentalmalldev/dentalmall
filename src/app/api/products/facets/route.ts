import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib';

// Facets for the shop filter UI: the brands and vendors that actually exist in
// the current category/vendor context (so customers don't click into empty
// results), plus the price bounds for the slider. Scoped to the BASE context
// (category / vendor / search) only — not the refinement filters — which keeps
// option lists stable as the customer ticks filters. Counts are category-level.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category_id = searchParams.get('category_id');
  const category_slug = searchParams.get('category_slug');
  const vendor_id = searchParams.get('vendor_id');
  const search = searchParams.get('search');

  const base: Prisma.productsWhereInput = {};
  if (category_id) base.category_id = category_id;
  else if (category_slug) base.category = { slug: category_slug };
  if (vendor_id) base.vendor_id = vendor_id;
  if (search) {
    base.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { name_ka: { contains: search, mode: 'insensitive' } },
      { manufacturer: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [brandGroups, vendorGroups, priceAgg] = await Promise.all([
    prisma.products.groupBy({
      by: ['manufacturer'],
      where: { ...base, manufacturer: { not: null } },
      _count: { _all: true },
    }),
    prisma.products.groupBy({
      by: ['vendor_id'],
      where: { ...base, vendor_id: { not: null } },
      _count: { _all: true },
    }),
    prisma.products.aggregate({
      where: base,
      _min: { price: true },
      _max: { price: true },
    }),
  ]);

  const manufacturers = brandGroups
    .filter((g) => g.manufacturer && g.manufacturer.trim() !== '')
    .map((g) => ({ value: g.manufacturer as string, count: g._count._all }))
    .sort((a, b) => b.count - a.count);

  const vendorIds = vendorGroups
    .map((g) => g.vendor_id)
    .filter((id): id is string => !!id);
  const vendorRows = vendorIds.length
    ? await prisma.vendors.findMany({
        where: { id: { in: vendorIds } },
        select: { id: true, company_name: true },
      })
    : [];
  const vendorNameById = new Map(vendorRows.map((v) => [v.id, v.company_name]));
  const vendors = vendorGroups
    .filter((g) => g.vendor_id)
    .map((g) => ({
      id: g.vendor_id as string,
      name: vendorNameById.get(g.vendor_id as string) || '—',
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    manufacturers,
    vendors,
    priceMin: priceAgg._min.price ? Math.floor(Number(priceAgg._min.price)) : 0,
    priceMax: priceAgg._max.price ? Math.ceil(Number(priceAgg._max.price)) : 0,
  });
}
