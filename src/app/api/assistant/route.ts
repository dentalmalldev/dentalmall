import { randomUUID } from 'crypto';
import { after, NextRequest, NextResponse } from 'next/server';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib';
import { askAssistant, DEFAULT_MODEL, type ChatTurn } from '@/lib/assistant/agent';
import { getCatalogue } from '@/lib/assistant/catalogue.server';
import { rateLimit } from '@/lib/assistant/rate-limit';
import { getAssistantConfig, isAssistantEnabled, publicAppearance } from '@/lib/assistant/settings.server';
import type { AssistantPublicConfig, AssistantResponse } from '@/types/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
// Typical answer ~5s; a hard question can take several tool rounds.
export const maxDuration = 60;

const MAX_QUESTION = 500;
const MAX_TURNS = 10;

// History comes from the browser, so accept only well-formed, bounded turns.
function cleanHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (t): t is ChatTurn =>
        (t?.role === 'user' || t?.role === 'assistant') && typeof t?.content === 'string'
    )
    .slice(-MAX_TURNS * 2)
    .map((t) => ({ role: t.role, content: t.content.slice(0, 2000) }));
}

// GET /api/assistant — whether to show the chat, and how it looks. Read at
// runtime (the pages are static), so the admin switch and appearance changes
// apply without rebuilding them.
export async function GET() {
  const { settings } = await getAssistantConfig();
  const enabled = isAssistantEnabled(settings);
  const config: AssistantPublicConfig = { enabled, appearance: enabled ? publicAppearance(settings) : null };
  return NextResponse.json(config);
}

// POST /api/assistant { question, history?, sessionId? } — public, like product
// search. The OpenRouter key stays on the server; the browser never sees it.
export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const { settings, faqs } = await getAssistantConfig();
  if (!apiKey || !isAssistantEnabled(settings)) {
    return NextResponse.json({ error: 'disabled' }, { status: 503 });
  }

  const visitor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!rateLimit(visitor, settings.rate_limit)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let body: { question?: unknown; history?: unknown; sessionId?: unknown; locale?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const question = String(body.question ?? '').trim().slice(0, MAX_QUESTION);
  if (!question) return NextResponse.json({ error: 'empty_question' }, { status: 400 });
  const sessionId = typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : null;
  const locale = body.locale === 'en' ? 'en' : 'ka';

  const id = randomUUID();
  const model = settings.model || process.env.ASSISTANT_MODEL || DEFAULT_MODEL;
  const started = Date.now();

  try {
    const cat = await getCatalogue();
    const r = await askAssistant(cat, question, cleanHistory(body.history), {
      apiKey,
      model,
      referer: process.env.NEXT_PUBLIC_SITE_URL || 'https://dentalmall.ge',
      knowledge: faqs,
      extraInstructions: settings.extra_instructions,
    });
    // Off-topic (or code-shaped) answers never reach the customer: a fixed
    // message in their site language goes out instead of the model's text.
    const reply = r.offTopic ? (await getTranslations({ locale, namespace: 'assistant' }))('offTopic') : r.reply;

    // Written after the response is sent; a failed log never fails the answer.
    after(() =>
      prisma.assistant_logs
        .create({
          data: {
            id,
            question,
            reply,
            product_ids: r.products.map((p) => p.id),
            searches: r.searches,
            invented: r.invented.length,
            model: r.model,
            cost_usd: r.costUsd,
            duration_ms: Math.round(r.seconds * 1000),
            session_id: sessionId,
          },
        })
        .catch((err: unknown) => console.error('[assistant] log failed', err))
    );

    const response: AssistantResponse = { id, reply, products: r.products };
    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[assistant]', message);
    after(() =>
      prisma.assistant_logs
        .create({
          data: {
            id,
            question,
            reply: '',
            product_ids: [],
            searches: [],
            model,
            cost_usd: 0,
            duration_ms: Date.now() - started,
            session_id: sessionId,
            error: message.slice(0, 500),
          },
        })
        .catch(() => {})
    );
    // The chat falls back to a link to the normal search with the same words.
    return NextResponse.json({ error: 'unavailable' }, { status: 502 });
  }
}
