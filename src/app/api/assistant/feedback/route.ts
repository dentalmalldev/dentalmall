import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib';

export const runtime = 'nodejs';

// POST /api/assistant/feedback { id, helpful } — thumbs up/down on one answer.
// `id` is the one returned by /api/assistant: a random UUID, so only the person
// who got the answer can rate it.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.id !== 'string' || typeof body.helpful !== 'boolean') {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  // updateMany: no error if the log row has not been written yet or never will be.
  await prisma.assistant_logs
    .updateMany({ where: { id: body.id.slice(0, 64) }, data: { helpful: body.helpful } })
    .catch((err: unknown) => console.error('[assistant] feedback failed', err));
  return NextResponse.json({ ok: true });
}
