import { NextRequest, NextResponse } from 'next/server';
import { withAuth, prisma } from '@/lib';
import { bulkDeleteSchema } from '@/lib/validations/bulkEditProducts';
import { resolveBulkTargetIds } from '@/lib/admin/product-filter-query';

const MAX_BULK_PRODUCTS = 1000;

export async function DELETE(request: NextRequest) {
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

      const parsed = bulkDeleteSchema.safeParse(await req.json());
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation failed', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const ids = await resolveBulkTargetIds(parsed.data.target);
      if (ids.length === 0) {
        return NextResponse.json({ error: 'No products matched the selection' }, { status: 400 });
      }
      if (ids.length > MAX_BULK_PRODUCTS) {
        return NextResponse.json(
          { error: `Selection too large (${ids.length}). Narrow the filters to ≤ ${MAX_BULK_PRODUCTS}.` },
          { status: 400 }
        );
      }

      // Products referenced by orders cannot be deleted (order_items has no cascade).
      // Block the whole batch rather than partially deleting, so the admin can refine.
      const withOrders = await prisma.order_items.findMany({
        where: { product_id: { in: ids } },
        select: { product_id: true },
        distinct: ['product_id'],
      });
      if (withOrders.length > 0) {
        return NextResponse.json(
          {
            error: `${withOrders.length} of the selected products are referenced by existing orders and cannot be deleted. Remove them from the selection and try again.`,
            blocked_count: withOrders.length,
          },
          { status: 409 }
        );
      }

      // Single transaction — media / variants / cart_items cascade on product delete.
      await prisma.$transaction(
        async (tx) => {
          await tx.products.deleteMany({ where: { id: { in: ids } } });
        },
        { timeout: 60_000, maxWait: 10_000 }
      );

      await prisma.admin_action_logs.create({
        data: {
          admin_id: adminUser.id,
          action: 'BULK_DELETE_PRODUCTS',
          details: JSON.stringify({ count: ids.length, product_ids: ids }),
        },
      });

      return NextResponse.json({ deleted: ids.length });
    } catch (error) {
      console.error('Bulk delete error:', error);
      return NextResponse.json({ error: 'Failed to delete products' }, { status: 500 });
    }
  });
}
