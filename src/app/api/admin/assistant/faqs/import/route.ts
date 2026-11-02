import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';
import { logAdminAction } from '@/lib/admin-log';
import { invalidateAssistantConfig } from '@/lib/assistant/settings.server';
import ka from '@/i18n/messages/ka.json';
import en from '@/i18n/messages/en.json';

interface SiteFaq {
  id: string;
  question: string;
  answer: string;
}

// POST /api/admin/assistant/faqs/import - Copy the public FAQ page's entries
// (ka.json / en.json, matched by id) into the assistant's knowledge. Entries
// whose Georgian question is already there are skipped, so importing twice adds
// nothing. The copies are independent: editing them doesn't change /faq.
export async function POST(request: NextRequest) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const adminUser = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
      }

      const enById = new Map((en.faqs as SiteFaq[]).map((f) => [f.id, f]));
      const existing = new Set(
        (await prisma.assistant_faqs.findMany({ select: { question_ka: true } })).map((f) => f.question_ka.trim())
      );
      const last = await prisma.assistant_faqs.aggregate({ _max: { sort_order: true } });
      let order = (last._max.sort_order ?? -1) + 1;

      const toCreate = (ka.faqs as SiteFaq[])
        .filter((f) => enById.has(f.id) && !existing.has(f.question.trim()))
        .map((f) => {
          const english = enById.get(f.id)!;
          return {
            question_ka: f.question.trim(),
            answer_ka: f.answer.trim(),
            question_en: english.question.trim(),
            answer_en: english.answer.trim(),
            sort_order: order++,
          };
        });

      if (toCreate.length > 0) {
        await prisma.assistant_faqs.createMany({ data: toCreate });
        invalidateAssistantConfig();
        await logAdminAction(adminUser.id, 'ASSISTANT_FAQ_IMPORTED', undefined, `${toCreate.length} entries from the site FAQ`);
      }

      return NextResponse.json({ imported: toCreate.length, skipped: (ka.faqs as SiteFaq[]).length - toCreate.length });
    } catch (error) {
      console.error('Import assistant FAQs error:', error);
      return NextResponse.json({ error: 'Failed to import the site FAQ' }, { status: 500 });
    }
  });
}
