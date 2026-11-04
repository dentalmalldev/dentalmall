/**
 * Minimal per-visitor rate limit: N requests per window, in memory.
 *
 * Stops a single tab hammering the endpoint. It is per server instance, so on
 * Vercel an abuser spread across instances gets more; the real backstop is the
 * monthly credit limit on the OpenRouter key. If abuse shows up in the logs,
 * swap this for @upstash/ratelimit behind the same interface.
 */
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit = 20, windowMs = 10 * 60_000): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 10_000) {
    // Bound memory: drop visitors with no recent activity.
    for (const [k, ts] of hits) if (!ts.some((t) => now - t < windowMs)) hits.delete(k);
  }
  return true;
}
