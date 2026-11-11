import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma, withAuth } from '@/lib';

const seenSchema = z.object({ ids: z.array(z.string().min(1)).max(500) });

// POST /api/credit/seen { ids } - The customer closed the congratulation modal
// for these additions, so it won't show them again. Only the caller's own rows
// are touched.
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const parsed = seenSchema.safeParse(await req.json().catch(() => null));
      if (!parsed.success) return NextResponse.json({ error: 'validation_failed' }, { status: 400 });

      const user = await prisma.users.findUnique({
        where: { firebase_uid: authUser.uid },
        select: { id: true },
      });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      const { count } = await prisma.credit_transactions.updateMany({
        where: { id: { in: parsed.data.ids }, user_id: user.id, seen_at: null },
        data: { seen_at: new Date() },
      });

      return NextResponse.json({ marked: count });
    } catch (error) {
      console.error('Mark credit seen error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  });
}
