import { after, NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';
import { notifyProductRequest } from '@/lib/product-requests/notify';
import { isOwnProductRequestPhoto } from '@/lib/product-requests/photos';
import {
  createProductRequestZodSchema,
  MAX_REQUESTS_PER_HOUR,
} from '@/lib/validations/product-request';

const ONE_HOUR_MS = 60 * 60 * 1000;

// GET - The logged-in user's requested products, newest request first and in
// the order typed within a request: exactly what they entered. Admin-only
// fields (status, admin_note) stay out.
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const items = await prisma.product_request_items.findMany({
        where: { request: { user_id: user.id } },
        select: {
          id: true,
          request_id: true,
          name: true,
          invoice_name: true,
          description: true,
          estimated_price: true,
          store: true,
          photo_url: true,
          quantity: true,
          created_at: true,
        },
        // Items of one request share created_at; their cuids follow entry order.
        orderBy: [{ created_at: 'desc' }, { id: 'asc' }],
      });

      return NextResponse.json(items);
    } catch (error) {
      console.error('Error fetching product requests:', error);
      return NextResponse.json({ error: 'Failed to fetch product requests' }, { status: 500 });
    }
  });
}

// POST - Create a product request for the logged-in user
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
        select: { id: true, email: true, first_name: true, last_name: true, phone_number: true },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const body = await req.json().catch(() => null);
      const validationResult = createProductRequestZodSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'validation_failed', details: validationResult.error.issues },
          { status: 400 }
        );
      }

      const { items, phone_number: enteredPhone } = validationResult.data;

      // An existing number is kept: the form hides the input for those users.
      const phoneNumber = user.phone_number ?? enteredPhone;
      if (!phoneNumber) {
        return NextResponse.json({ error: 'phone_required' }, { status: 400 });
      }

      if (items.some((item) => item.photo_url && !isOwnProductRequestPhoto(item.photo_url, user.id))) {
        return NextResponse.json({ error: 'invalid_photo' }, { status: 400 });
      }

      const created = await prisma.$transaction(async (tx) => {
        // Serialise per user so two simultaneous sends can't both pass the count.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${user.id}))`;

        const recentRequests = await tx.product_requests.count({
          where: {
            user_id: user.id,
            created_at: { gte: new Date(Date.now() - ONE_HOUR_MS) },
          },
        });

        if (recentRequests >= MAX_REQUESTS_PER_HOUR) {
          return null;
        }

        if (!user.phone_number) {
          await tx.users.update({
            where: { id: user.id },
            data: { phone_number: phoneNumber },
          });
        }

        return tx.product_requests.create({
          data: {
            user_id: user.id,
            items: {
              create: items.map((item) => ({
                name: item.name,
                invoice_name: item.invoice_name || null,
                description: item.description,
                estimated_price: item.estimated_price,
                store: item.store,
                photo_url: item.photo_url || null,
                quantity: item.quantity,
              })),
            },
          },
          select: { id: true },
        });
      });

      if (!created) {
        return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
      }

      // Emails go out after the response, so a slow or failing mail server can't
      // hold up or fail a request that is already saved.
      after(() =>
        notifyProductRequest({
          customer: { ...user, phone_number: phoneNumber },
          items,
        })
      );

      return NextResponse.json({ id: created.id, count: items.length }, { status: 201 });
    } catch (error) {
      console.error('Error creating product request:', error);
      return NextResponse.json({ error: 'Failed to create product request' }, { status: 500 });
    }
  });
}
