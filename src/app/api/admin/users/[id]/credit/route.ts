import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';
import { logAdminAction } from '@/lib/admin-log';
import { changeCreditByAdmin, CreditChangeError } from '@/lib/credit/ledger.server';
import { creditChangeZodSchema } from '@/lib/validations/credit';

const HISTORY_LIMIT = 200;

async function requireAdmin(uid: string) {
  const admin = await prisma.users.findUnique({ where: { firebase_uid: uid } });
  return admin && admin.role === 'ADMIN' ? admin : null;
}

// GET /api/admin/users/[id]/credit - The user's balance and credit history,
// newest first. ADMIN only.
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const admin = await requireAdmin(authUser.uid);
      if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const { id } = await params;
      const user = await prisma.users.findUnique({ where: { id }, select: { credit_balance: true } });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const transactions = await prisma.credit_transactions.findMany({
        where: { user_id: id },
        select: {
          id: true,
          type: true,
          amount: true,
          balance_after: true,
          note: true,
          created_at: true,
          admin: { select: { first_name: true, last_name: true, email: true } },
          order: { select: { order_number: true } },
        },
        orderBy: { created_at: 'desc' },
        take: HISTORY_LIMIT,
      });

      return NextResponse.json({ balance: user.credit_balance, transactions });
    } catch (error) {
      console.error('Get user credit error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}

// POST /api/admin/users/[id]/credit { type: ADD|SUBTRACT|SET, amount, note } -
// Change the user's balance. The change and its history row are written
// together; the balance can't go below 0. ADMIN only.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (req, authUser) => {
    try {
      const admin = await requireAdmin(authUser.uid);
      if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

      const { id } = await params;
      const body = await req.json().catch(() => null);
      const parsed = creditChangeZodSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message ?? 'validation_failed' },
          { status: 400 }
        );
      }

      const { type, amount, note } = parsed.data;
      const transaction = await prisma.$transaction((tx) =>
        changeCreditByAdmin(tx, { userId: id, adminId: admin.id, type, amount, note })
      );

      await logAdminAction(
        admin.id,
        'CREDIT_CHANGED',
        id,
        `${type} ₾${amount.toFixed(2)} → balance ₾${transaction.balance_after.toFixed(2)} — ${note}`
      );

      return NextResponse.json({ balance: transaction.balance_after, transaction }, { status: 201 });
    } catch (error) {
      if (error instanceof CreditChangeError) {
        return error.code === 'USER_NOT_FOUND'
          ? NextResponse.json({ error: 'User not found' }, { status: 404 })
          : NextResponse.json({ error: 'negative_balance' }, { status: 400 });
      }
      console.error('Change user credit error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
