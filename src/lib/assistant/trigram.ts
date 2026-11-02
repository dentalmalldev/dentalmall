/**
 * pg_trgm's similarity(), in TypeScript: Jaccard over word trigrams, each word
 * padded with two leading spaces and one trailing space. Fuzzy matching without
 * installing the extension in the database.
 */
export function trigrams(s: string): Set<string> {
  const out = new Set<string>();
  for (const word of s.split(/\s+/).filter(Boolean)) {
    const p = `  ${word} `;
    for (let i = 0; i < p.length - 2; i++) out.add(p.slice(i, i + 3));
  }
  return out;
}

export function similarity(a: string, b: string): number {
  const A = trigrams(a);
  const B = trigrams(b);
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** Best similarity between the query and any single word of the document. */
export function wordBest(query: string, doc: string): number {
  let best = 0;
  for (const w of doc.split(/\s+/)) if (w) best = Math.max(best, similarity(query, w));
  return best;
}
