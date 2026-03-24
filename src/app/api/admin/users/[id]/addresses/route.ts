import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';

// GET /api/admin/users/[id]/addresses
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (_req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const addresses = await prisma.addresses.findMany({
      where: { user_id: id },
      orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });
    return NextResponse.json(addresses);
  });
}

// POST /api/admin/users/[id]/addresses
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { recipient_name, mobile_number, city, address, postal_code, is_default } = body;

    if (!recipient_name || !mobile_number || !city || !address) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 });
    }

    // If setting as default, unset others
    if (is_default) {
      await prisma.addresses.updateMany({ where: { user_id: id }, data: { is_default: false } });
    }

    const created = await prisma.addresses.create({
      data: { user_id: id, recipient_name, mobile_number, city, address, postal_code: postal_code || null, is_default: !!is_default },
    });
    return NextResponse.json(created, { status: 201 });
  });
}
