import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { prisma, withAuth } from '@/lib';
import { rateLimit } from '@/lib/assistant/rate-limit';
import { uploadToStorage } from '@/lib/firebase-admin';
import { processImage } from '@/lib/images/processImage';
import { productRequestPhotoPrefix } from '@/lib/product-requests/photos';
import {
  ALLOWED_PHOTO_TYPES,
  MAX_PHOTO_BYTES,
  MAX_PRODUCTS_PER_REQUEST,
  MAX_REQUESTS_PER_HOUR,
} from '@/lib/validations/product-request';

// A customer can't legitimately need more than a photo per product per request.
const MAX_UPLOADS_PER_HOUR = MAX_REQUESTS_PER_HOUR * MAX_PRODUCTS_PER_REQUEST;
const ONE_HOUR_MS = 60 * 60 * 1000;
const ALLOWED_FORMATS = ['jpeg', 'png', 'webp'];

// POST - Upload one product request photo (any logged-in user)
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      if (!rateLimit(`product-request-upload:${user.id}`, MAX_UPLOADS_PER_HOUR, ONE_HOUR_MS)) {
        return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
      }

      const formData = await req.formData();
      const file = formData.get('file');

      if (!(file instanceof File)) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
      }

      if (file.size > MAX_PHOTO_BYTES) {
        return NextResponse.json({ error: 'too_large' }, { status: 400 });
      }

      const bytes = new Uint8Array(await file.arrayBuffer());

      // processImage stores anything it can't read as-is, and the browser picks
      // file.type. This route is open to every customer, so check the real bytes.
      const format = await sharp(bytes).metadata().then((m) => m.format, () => null);
      if (!format || !ALLOWED_FORMATS.includes(format)) {
        return NextResponse.json({ error: 'invalid_type' }, { status: 400 });
      }

      const processed = await processImage(bytes, file.name, file.type);
      const extension = processed.contentType === 'image/webp' ? 'webp' : format;

      const url = await uploadToStorage(
        Buffer.from(processed.buffer),
        `${productRequestPhotoPrefix(user.id)}${randomUUID()}.${extension}`,
        processed.contentType
      );

      return NextResponse.json({ url }, { status: 201 });
    } catch (error) {
      console.error('Error uploading product request photo:', error);
      return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }
  });
}
