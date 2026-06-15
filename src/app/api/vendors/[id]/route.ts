import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const vendor = await prisma.vendors.findUnique({
      where: { id },
      select: {
        id: true,
        company_name: true,
        email: true,
        description: true,
        city: true,
        address: true,
        phone_number: true,
        logo: true,
        is_active: true,
        created_at: true,
        _count: { select: { products: true } },
      },
    });

    // Hide non-existent and inactive/suspended vendors from the storefront.
    if (!vendor || !vendor.is_active) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const { _count, ...rest } = vendor;
    return NextResponse.json({ ...rest, product_count: _count.products });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor' },
      { status: 500 }
    );
  }
}
