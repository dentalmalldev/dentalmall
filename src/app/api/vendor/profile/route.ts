import { NextRequest, NextResponse } from 'next/server';
import { withAuth, prisma, uploadBuffer } from '@/lib';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user || user.role !== 'VENDOR') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      const { searchParams } = new URL(req.url);
      const vendorId = searchParams.get('vendor_id');

      const vendor = await prisma.vendors.findFirst({
        where: vendorId ? { id: vendorId, user_id: user.id } : { user_id: user.id },
      });

      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
      }

      return NextResponse.json(vendor);
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
      return NextResponse.json({ error: 'Failed to fetch vendor profile' }, { status: 500 });
    }
  });
}

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!user || user.role !== 'VENDOR') {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      const formData = await req.formData();
      const vendorId = formData.get('vendor_id') as string | null;
      const file = formData.get('logo') as File | null;

      const vendor = await prisma.vendors.findFirst({
        where: vendorId ? { id: vendorId, user_id: user.id } : { user_id: user.id },
      });

      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
      }

      let logoUrl = vendor.logo;

      if (file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP' }, { status: 400 });
        }
        if (file.size > 2 * 1024 * 1024) {
          return NextResponse.json({ error: 'File too large. Maximum size is 2MB' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = new Uint8Array(bytes);
        const result = await uploadBuffer(buffer, file.name, file.type, 'vendors');
        logoUrl = result.url;
      }

      const updated = await prisma.vendors.update({
        where: { id: vendor.id },
        data: { logo: logoUrl },
      });

      return NextResponse.json(updated);
    } catch (error) {
      console.error('Error updating vendor profile:', error);
      return NextResponse.json({ error: 'Failed to update vendor profile' }, { status: 500 });
    }
  });
}
