import { NextRequest, NextResponse } from 'next/server';
import { prisma, withAuth } from '@/lib';
import { sendEmail } from '@/lib/email/nodemailer';
import { logAdminAction } from '@/lib/admin-log';

// POST /api/admin/users/[id]/send-email
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { subject, message } = body;

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    // Rate limit: 10 emails per admin per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.admin_action_logs.count({
      where: {
        admin_id: admin.id,
        action: 'EMAIL_SENT',
        created_at: { gte: oneHourAgo },
      },
    });
    if (recentCount >= 10) {
      return NextResponse.json({ error: 'Rate limit: max 10 emails per hour' }, { status: 429 });
    }

    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Sanitize: strip HTML tags from message
    const safeMessage = message.replace(/<[^>]*>/g, '');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #5B6ECD; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">DentalMall</h1>
        </div>
        <div style="border: 1px solid #e0e0e0; border-top: none; padding: 32px; border-radius: 0 0 12px 12px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6;">${safeMessage.replace(/\n/g, '<br/>')}</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;"/>
          <p style="color: #999; font-size: 12px;">DentalMall Admin Team</p>
        </div>
      </div>
    `;

    await sendEmail({ to: user.email, subject: subject.trim(), html, text: safeMessage });
    await logAdminAction(admin.id, 'EMAIL_SENT', id, `Subject: ${subject.trim()}`);

    return NextResponse.json({ message: 'Email sent' });
  });
}

// GET /api/admin/users/[id]/send-email — email history
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth(request, async (_req, authUser) => {
    const admin = await prisma.users.findUnique({ where: { firebase_uid: authUser.uid } });
    if (!admin || admin.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const logs = await prisma.admin_action_logs.findMany({
      where: { target_user_id: id, action: 'EMAIL_SENT' },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return NextResponse.json(logs);
  });
}
