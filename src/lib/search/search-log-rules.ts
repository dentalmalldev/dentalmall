/**
 * The pure rules behind search logging: what gets logged, and what gets
 * scrubbed first. No I/O and no framework imports, so they can be tested alone.
 */

export type MatchedVia = 'direct' | 'fold' | 'trigram' | 'category' | 'none';

export interface SearchEvent {
  /** Raw user input, before any normalisation. */
  query: string;
  resultCount: number;
  matchedVia: MatchedVia;
  durationMs?: number;
  userId?: string | null;
  /** Random per-visit id. Not a user identifier. */
  sessionId?: string | null;
  /** The request's user-agent, for bot classification only; never stored. */
  userAgent?: string | null;
  /**
   * True when this is a search the person meant to run — they stopped typing,
   * pressed Enter, or a debounce elapsed. False for intermediate keystrokes.
   */
  committed: boolean;
}

const BOT = /bot|crawl|spider|slurp|bingpreview|headless|lighthouse|monitor|curl|wget|python-requests/i;

/** Queries that look like contact details, which nobody meant to type into search. */
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.]+/g;
const LONG_DIGITS = /\d{7,}/g;

/**
 * Should this event be written at all?
 *
 * If every keystroke logged, the top failed query in two weeks would be "k",
 * then "ko", "kom"… So the CLIENT debounces and sets `committed`, and
 * uncommitted events are dropped here. The length floor is a second line of
 * defence, not the mechanism.
 */
export function shouldLog(e: SearchEvent): boolean {
  if (!e.committed) return false;
  const q = e.query.trim();
  if (q.length < 2) return false;
  if (q.length > 200) return false; // paste accidents, not searches
  return true;
}

/** Replace everything that looks like contact details before storing. */
export function redact(query: string): string {
  return query.replace(EMAIL, '[email]').replace(LONG_DIGITS, '[number]');
}

export function isBot(userAgent: string | null | undefined): boolean {
  return BOT.test(userAgent ?? '');
}
