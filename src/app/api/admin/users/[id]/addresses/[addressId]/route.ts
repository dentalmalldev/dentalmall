import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';

// PATCH /api/admin/users/[id]/addresses/[addressId]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; addressId: string }> }) {
  return withAuth(request, async (req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id, addressId } = await params;
    const body = await req.json();
    const { recipient_name, mobile_number, city, address, postal_code, is_default } = body;

    const existing = await prisma.addresses.findFirst({ where: { id: addressId, user_id: id } });
    if (!existing) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

    if (is_default) {
      await prisma.addresses.updateMany({ where: { user_id: id }, data: { is_default: false } });
    }

    const data: Record<string, unknown> = {};
    if (recipient_name !== undefined) data.recipient_name = recipient_name;
    if (mobile_number !== undefined) data.mobile_number = mobile_number;
    if (city !== undefined) data.city = city;
    if (address !== undefined) data.address = address;
    if (postal_code !== undefined) data.postal_code = postal_code || null;
    if (is_default !== undefined) data.is_default = is_default;

    const updated = await prisma.addresses.update({ where: { id: addressId }, data });
    return NextResponse.json(updated);
  });
}

// DELETE /api/admin/users/[id]/addresses/[addressId]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; addressId: string }> }) {
  return withAuth(request, async (_req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id, addressId } = await params;
    const existing = await prisma.addresses.findFirst({ where: { id: addressId, user_id: id } });
    if (!existing) return NextResponse.json({ error: 'Address not found' }, { status: 404 });

    await prisma.addresses.delete({ where: { id: addressId } });
    return NextResponse.json({ message: 'Address deleted' });
  });
}
