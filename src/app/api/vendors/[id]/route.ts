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
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json(vendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor' },
      { status: 500 }
    );
  }
}
