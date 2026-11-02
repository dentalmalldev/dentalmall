/**
 * Search logging. Three rules:
 *
 *  1. Logging never breaks a search: every failure path swallows.
 *  2. Logging never delays a search: the insert runs after the response.
 *  3. Logging records intent, not keystrokes (see shouldLog).
 */
import { after } from 'next/server';
import { prisma } from '@/lib';
import { fold } from '@/lib/assistant/fold';
import { isBot, redact, shouldLog, type SearchEvent } from './search-log-rules';

export type { MatchedVia, SearchEvent } from './search-log-rules';

/**
 * Record one search. Safe to call from any request handler. Uses after() so
 * the insert runs once the response is sent — on Vercel a floating promise can
 * be frozen with the function and silently lost.
 */
export function logSearch(e: SearchEvent): void {
  if (!shouldLog(e)) return;
  after(() => writeLog(e));
}

async function writeLog(e: SearchEvent): Promise<void> {
  try {
    const query = redact(e.query.trim());
    await prisma.search_logs.create({
      data: {
        query,
        query_folded: fold(query),
        result_count: e.resultCount,
        matched_via: e.matchedVia,
        duration_ms: e.durationMs ?? null,
        user_id: e.userId ?? null,
        session_id: e.sessionId ?? null,
        is_bot: isBot(e.userAgent),
      },
    });
  } catch (err) {
    // A logging failure must never reach a customer searching for composite.
    console.error('[search-log] write failed', err);
  }
}
