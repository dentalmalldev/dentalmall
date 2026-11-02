/**
 * One-way fold to a common ASCII search space, so Georgian, English and
 * Latin-typed Georgian compare equal:
 *
 *   კომპოზიტი  -> kompoziti
 *   kompozit    -> kompozit      (substring match, one query)
 *
 * Georgian -> Latin is deterministic. Where Georgian distinguishes sounds Latin
 * does not (ტ vs თ, კ vs ქ), both collapse to the same letter — a user typing
 * "t" did not choose between them either.
 *
 * Lossy on purpose: precision is recovered by ranking (trigram similarity,
 * field weighting), not by keeping the fold strict.
 */

/** Georgian letter -> Latin. Multi-character outputs are normalised in step 2. */
const KA_TO_LAT: Record<string, string> = {
  ა: 'a', ბ: 'b', გ: 'g', დ: 'd', ე: 'e', ვ: 'v', ზ: 'z', თ: 't',
  ი: 'i', კ: 'k', ლ: 'l', მ: 'm', ნ: 'n', ო: 'o', პ: 'p', ჟ: 'zh',
  რ: 'r', ს: 's', ტ: 't', უ: 'u', ფ: 'p', ქ: 'k', ღ: 'g', ყ: 'q',
  შ: 'sh', ჩ: 'ch', ც: 'ts', ძ: 'dz', წ: 'ts', ჭ: 'ch', ხ: 'kh',
  ჯ: 'j', ჰ: 'h',
};

/** Latin digraphs -> single letters. Applied to product text AND query. */
const DIGRAPH_COLLAPSE: Array<[RegExp, string]> = [
  [/sh/g, 's'], [/ch/g, 'c'], [/ts/g, 'c'], [/dz/g, 'z'],
  [/gh/g, 'g'], [/zh/g, 'j'], [/kh/g, 'k'], [/ph/g, 'p'], [/th/g, 't'],
];

/** Latin letters Georgians use interchangeably when typing without a Georgian keyboard. */
const LETTER_COLLAPSE: Record<string, string> = {
  q: 'k', x: 'k', y: 'k', w: 'c', f: 'p',
};

/**
 * Fold any text — Georgian, English, or Latin-typed Georgian — into the
 * comparison space. Idempotent: fold(fold(x)) === fold(x).
 */
export function fold(text: string): string {
  if (!text) return '';
  let s = text.toLowerCase();

  // Step 1 — Georgian to Latin.
  s = s.replace(/[Ⴀ-ჿ]/g, (ch) => KA_TO_LAT[ch] ?? '');

  // Step 2 — collapse Latin digraphs, then ambiguous single letters.
  for (const [re, to] of DIGRAPH_COLLAPSE) s = s.replace(re, to);
  s = s.replace(/[qxywf]/g, (ch) => LETTER_COLLAPSE[ch] ?? ch);

  // Step 3 — keep only letters and digits; separators become spaces.
  return s.replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Fold each part and join them into one searchable document. */
export function foldDocument(...parts: Array<string | null | undefined>): string {
  return parts.filter(Boolean).map((p) => fold(p as string)).join(' ');
}
