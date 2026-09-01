import { NextRequest, NextResponse } from 'next/server';
import { withAuth, prisma, uploadBuffer } from '@/lib';
import { processImage, MAX_LOGO_DIMENSION } from '@/lib/images/processImage';

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

      // Two shapes on this endpoint: multipart (logo upload) and JSON (visibility switch).
      const isJson = (req.headers.get('content-type') || '').includes('application/json');

      let vendorId: string | null = null;
      let file: File | null = null;
      let isPublished: boolean | undefined;

      if (isJson) {
        const body = await req.json();
        vendorId = typeof body.vendor_id === 'string' ? body.vendor_id : null;
        if (typeof body.is_published === 'boolean') isPublished = body.is_published;
      } else {
        const formData = await req.formData();
        vendorId = formData.get('vendor_id') as string | null;
        file = formData.get('logo') as File | null;
      }

      const vendor = await prisma.vendors.findFirst({
        where: vendorId ? { id: vendorId, user_id: user.id } : { user_id: user.id },
      });

      if (!vendor) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
      }

      // A deactivated store can't put itself back on the site.
      if (isPublished === true && !vendor.is_active) {
        return NextResponse.json(
          { error: 'This store is deactivated and cannot be published' },
          { status: 403 }
        );
      }

      let logoUrl = vendor.logo;

      if (file) {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP' }, { status: 400 });
        }
        // Roomy limit — the logo is scaled down and re-encoded below anyway.
        if (file.size > 10 * 1024 * 1024) {
          return NextResponse.json({ error: 'File too large. Maximum size is 10MB' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const processed = await processImage(
          new Uint8Array(bytes),
          file.name,
          file.type,
          MAX_LOGO_DIMENSION
        );
        const result = await uploadBuffer(
          processed.buffer,
          processed.filename,
          processed.contentType,
          'vendors'
        );
        logoUrl = result.url;
      }

      const updated = await prisma.vendors.update({
        where: { id: vendor.id },
        data: {
          logo: logoUrl,
          ...(isPublished !== undefined ? { is_published: isPublished } : {}),
        },
      });

      return NextResponse.json(updated);
    } catch (error) {
      console.error('Error updating vendor profile:', error);
      return NextResponse.json({ error: 'Failed to update vendor profile' }, { status: 500 });
    }
  });
}
