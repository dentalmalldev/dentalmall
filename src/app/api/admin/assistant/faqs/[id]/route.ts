import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';
import { logAdminAction } from '@/lib/admin-log';
import { invalidateAssistantConfig } from '@/lib/assistant/settings.server';
import { assistantFaqUpdateSchema } from '@/lib/validations/assistant';

type Params = Promise<{ id: string }>;

// PATCH /api/admin/assistant/faqs/[id] - Edit, switch on/off or reorder an entry.
export async function PATCH(request: NextRequest, { params }: { params: Params }) {
  return withAuth(request, async (req, authUser) => {
    try {
      const adminUser = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
      }

      const { id } = await params;
      const parsed = assistantFaqUpdateSchema.safeParse(await req.json().catch(() => null));
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid entry' }, { status: 400 });
      }

      const existing = await prisma.assistant_faqs.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      }

      const faq = await prisma.assistant_faqs.update({ where: { id }, data: parsed.data });
      invalidateAssistantConfig();
      await logAdminAction(adminUser.id, 'ASSISTANT_FAQ_UPDATED', undefined, faq.question_en);

      return NextResponse.json(faq);
    } catch (error) {
      console.error('Update assistant FAQ error:', error);
      return NextResponse.json({ error: 'Failed to save entry' }, { status: 500 });
    }
  });
}

// DELETE /api/admin/assistant/faqs/[id]
export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const adminUser = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
      if (!adminUser || adminUser.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Access denied. Admin privileges required.' }, { status: 403 });
      }

      const { id } = await params;
      const existing = await prisma.assistant_faqs.findUnique({ where: { id } });
      if (!existing) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      }

      await prisma.assistant_faqs.delete({ where: { id } });
      invalidateAssistantConfig();
      await logAdminAction(adminUser.id, 'ASSISTANT_FAQ_DELETED', undefined, existing.question_en);

      return NextResponse.json({ message: 'Entry deleted' });
    } catch (error) {
      console.error('Delete assistant FAQ error:', error);
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }
  });
}
