import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';
import {
  PRODUCT_REQUEST_TRANSITIONS,
  updateProductRequestItemZodSchema,
} from '@/lib/validations/product-request';

// PATCH - Change a requested product's status and/or admin note
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, authUser) => {
    try {
      const adminUser = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
      });

      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        );
      }

      const { id } = await params;
      const body = await req.json().catch(() => null);
      const validationResult = updateProductRequestItemZodSchema.safeParse(body);

      if (!validationResult.success) {
        return NextResponse.json({ error: 'validation_failed' }, { status: 400 });
      }

      const { status, admin_note } = validationResult.data;

      const item = await prisma.product_request_items.findUnique({ where: { id } });
      if (!item) {
        return NextResponse.json({ error: 'Requested product not found' }, { status: 404 });
      }

      if (status && status !== item.status && !PRODUCT_REQUEST_TRANSITIONS[item.status].includes(status)) {
        return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });
      }

      // Matching on the status we just checked means a second admin who changed
      // it a moment ago makes this a conflict, not a silent overwrite.
      const { count } = await prisma.product_request_items.updateMany({
        where: { id, status: item.status },
        data: {
          ...(status ? { status } : {}),
          ...(admin_note !== undefined ? { admin_note: admin_note || null } : {}),
        },
      });

      if (count === 0) {
        return NextResponse.json({ error: 'invalid_transition' }, { status: 409 });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error updating requested product:', error);
      return NextResponse.json(
        { error: 'Failed to update requested product' },
        { status: 500 }
      );
    }
  });
}
