import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';
import { tetriToDecimal, toTetri } from '@/lib/credit/money';

// GET /api/credit - The caller's credit balance, plus the admin additions they
// haven't closed the congratulation modal for (summed, with their ids so
// exactly those can be marked seen). Subtractions never count.
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
        select: { id: true, credit_balance: true },
      });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const unseen = await prisma.credit_transactions.findMany({
        where: {
          user_id: user.id,
          type: { in: ['ADMIN_ADD', 'ADMIN_SET'] },
          amount: { gt: 0 },
          seen_at: null,
        },
        select: { id: true, amount: true },
      });

      return NextResponse.json({
        balance: user.credit_balance,
        unseen: {
          amount: tetriToDecimal(unseen.reduce((sum, row) => sum + toTetri(row.amount), 0)),
          ids: unseen.map((row) => row.id),
        },
      });
    } catch (error) {
      console.error('Get credit error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
