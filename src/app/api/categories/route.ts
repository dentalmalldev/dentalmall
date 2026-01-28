import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib';

export async function GET() {
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
