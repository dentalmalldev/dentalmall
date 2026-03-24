import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';

// PATCH /api/admin/users/[id]/vendor
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { company_name, identification_number, email, description, city, address, phone_number, is_active } = body;

    const vendor = await prisma.vendors.findFirst({ where: { user_id: id } });
    if (!vendor) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

    const data: Record<string, unknown> = {};
    if (company_name !== undefined) data.company_name = company_name;
    if (identification_number !== undefined) data.identification_number = identification_number;
    if (email !== undefined) data.email = email;
    if (description !== undefined) data.description = description;
    if (city !== undefined) data.city = city;
    if (address !== undefined) data.address = address;
    if (phone_number !== undefined) data.phone_number = phone_number;
    if (is_active !== undefined) data.is_active = is_active;

    const updated = await prisma.vendors.update({ where: { id: vendor.id }, data });
    return NextResponse.json(updated);
  });
}
