import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';
import { logAdminAction } from '@/lib/admin-log';
import { invalidateAssistantConfig } from '@/lib/assistant/settings.server';
import { assistantFaqSchema } from '@/lib/validations/assistant';

// GET /api/admin/assistant/faqs - All knowledge entries, inactive ones included.
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const adminUser = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
      }

      const faqs = await prisma.assistant_faqs.findMany({
        orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
      });
      return NextResponse.json({ data: faqs });
    } catch (error) {
      console.error('Get assistant FAQs error:', error);
      return NextResponse.json({ error: 'Failed to load entries' }, { status: 500 });
    }
  });
}

// POST /api/admin/assistant/faqs - Add an entry (at the end unless sort_order is given).
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const adminUser = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
      }

      const parsed = assistantFaqSchema.safeParse(await req.json().catch(() => null));
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid entry' }, { status: 400 });
      }

      const last = await prisma.assistant_faqs.aggregate({ _max: { sort_order: true } });
      const faq = await prisma.assistant_faqs.create({
        data: { sort_order: (last._max.sort_order ?? -1) + 1, ...parsed.data },
      });
      invalidateAssistantConfig();
      await logAdminAction(adminUser.id, 'ASSISTANT_FAQ_CREATED', undefined, faq.question_en);

      return NextResponse.json(faq, { status: 201 });
    } catch (error) {
      console.error('Create assistant FAQ error:', error);
      return NextResponse.json({ error: 'Failed to add entry' }, { status: 500 });
    }
  });
}
