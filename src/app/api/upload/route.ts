import { NextRequest, NextResponse } from 'next/server';
import { withAuth, prisma, uploadBuffer } from '@/lib';

// POST - Upload media files (admin only)
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      // Verify admin role
      const adminUser = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        );
      }

      const formData = await req.formData();
      const files = formData.getAll('files') as File[];
      const productId = formData.get('product_id') as string | null;
      const folder = (formData.get('folder') as string) || 'products';

      if (!files || files.length === 0) {
        return NextResponse.json(
          { error: 'No files provided' },
          { status: 400 }
        );
      }

      // Validate file types
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      for (const file of files) {
        if (!allowedTypes.includes(file.type)) {
          return NextResponse.json(
            { error: `Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}` },
            { status: 400 }
          );
        }

        if (file.size > maxSize) {
          return NextResponse.json(
            { error: `File ${file.name} is too large. Maximum size is 5MB` },
            { status: 400 }
          );
        }
      }

      // If productId is provided, verify product exists
      if (productId) {
        const product = await prisma.products.findUnique({
          where: { id: productId },
        });

        if (!product) {
          return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
          );
        }
      }

      const uploadResults = [];

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = new Uint8Array(bytes);

        const result = await uploadBuffer(
          buffer,
          file.name,
          file.type,
          folder
        );

        // Save media record to database
        const media = await prisma.media.create({
          data: {
            url: result.url,
            filename: result.filename,
            original_name: result.originalName,
            type: file.type.startsWith('image/') ? 'image' : 'file',
            size: result.size,
            product_id: productId || null,
          },
        });

        uploadResults.push(media);
      }

      return NextResponse.json(uploadResults, { status: 201 });
    } catch (error) {
      console.error('Error uploading files:', error);
      return NextResponse.json(
        { error: 'Failed to upload files' },
        { status: 500 }
      );
    }
  });
}

// PATCH - Link media to a product (admin only)
export async function PATCH(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      // Verify admin role
      const adminUser = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        );
      }

      const body = await req.json();
      const { media_id, product_id } = body;

      if (!media_id) {
        return NextResponse.json(
          { error: 'Media ID is required' },
          { status: 400 }
        );
      }

      const media = await prisma.media.findUnique({
        where: { id: media_id },
      });

      if (!media) {
        return NextResponse.json(
          { error: 'Media not found' },
          { status: 404 }
        );
      }

      // Verify product exists if product_id is provided
      if (product_id) {
        const product = await prisma.products.findUnique({
          where: { id: product_id },
        });

        if (!product) {
          return NextResponse.json(
            { error: 'Product not found' },
            { status: 404 }
          );
        }
      }

      const updatedMedia = await prisma.media.update({
        where: { id: media_id },
        data: { product_id: product_id || null },
      });

      return NextResponse.json(updatedMedia);
    } catch (error) {
      console.error('Error linking media:', error);
      return NextResponse.json(
        { error: 'Failed to link media' },
        { status: 500 }
      );
    }
  });
}

// DELETE - Delete media file (admin only)
export async function DELETE(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      // Verify admin role
      const adminUser = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(req.url);
      const mediaId = searchParams.get('id');

      if (!mediaId) {
        return NextResponse.json(
          { error: 'Media ID is required' },
          { status: 400 }
        );
      }

      const media = await prisma.media.findUnique({
        where: { id: mediaId },
      });

      if (!media) {
        return NextResponse.json(
          { error: 'Media not found' },
          { status: 404 }
        );
      }

      // Delete from Firebase Storage
      try {
        const { deleteFile } = await import('@/lib/firebase-storage');
        await deleteFile(media.filename, 'products');
      } catch (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }

      // Delete from database
      await prisma.media.delete({
        where: { id: mediaId },
      });

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting media:', error);
      return NextResponse.json(
        { error: 'Failed to delete media' },
        { status: 500 }
      );
    }
  });
}
