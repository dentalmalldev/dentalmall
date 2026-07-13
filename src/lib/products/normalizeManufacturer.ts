import { prisma } from '@/lib';

/**
 * Brand (manufacturer) normalization — case-insensitive, single source of truth.
 *
 * Rule: a brand is the same brand regardless of casing. On save we reuse the
 * existing canonical spelling if one exists (case-insensitive match); otherwise
 * the incoming (trimmed) value becomes the canonical spelling going forward.
 *
 * Only casing/whitespace is normalized — accents and punctuation are NOT touched
 * ("Maestra-X" and "MaestraX" are intentionally different brands).
 */

type ProductClient = Pick<typeof prisma, 'products'>;

/**
 * Look up the canonical spelling for a manufacturer value. Reuses an existing
 * spelling if it matches case-insensitively; otherwise returns the trimmed input
 * (which becomes the canonical). Returns null for empty input.
 */
export async function normalizeManufacturer(
  input: string | null | undefined,
  client: ProductClient = prisma
): Promise<string | null> {
  const trimmed = input?.trim();
  if (!trimmed) return null;

  const hit = await client.products.findFirst({
    where: { manufacturer: { equals: trimmed, mode: 'insensitive' } },
    select: { manufacturer: true },
  });
  return hit?.manufacturer ?? trimmed;
}

/**
 * In-memory resolver for bulk operations — avoids one DB round-trip per row.
 * Seed with the existing manufacturer spellings; the returned function reuses a
 * known canonical (case-insensitive) or registers the new value as canonical so
 * later rows in the same batch reuse it (e.g. "MAESTRA" then "Maestra" → one brand).
 */
export function createManufacturerResolver(existing: (string | null)[]) {
  const canonicalByLower = new Map<string, string>();
  for (const m of existing) {
    const trimmed = m?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!canonicalByLower.has(key)) canonicalByLower.set(key, trimmed);
  }

  return (input: string | null | undefined): string | null => {
    const trimmed = input?.trim();
    if (!trimmed) return null;
    const key = trimmed.toLowerCase();
    const existingCanonical = canonicalByLower.get(key);
    if (existingCanonical) return existingCanonical;
    canonicalByLower.set(key, trimmed);
    return trimmed;
  };
}
