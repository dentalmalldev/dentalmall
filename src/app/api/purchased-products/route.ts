import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';
import { stripCostPrices } from '@/lib/products/publicPricing';
import { decodePurchasedCursor, loadPurchasedProductsPage } from '@/lib/purchased-products/query.server';

// GET /api/purchased-products?cursor= - Products the caller has had delivered,
// one entry per product + variant, most bought first, 25 per page. Any role
// with a profile may call it; only the caller's own orders are read.
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const rawCursor = req.nextUrl.searchParams.get('cursor');
      const cursor = rawCursor ? decodePurchasedCursor(rawCursor) : null;
      if (rawCursor && !cursor) {
        return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 });
      }

      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const page = await loadPurchasedProductsPage(user.id, cursor);
      return NextResponse.json(stripCostPrices(page));
    } catch (error) {
      console.error('Get purchased products error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
