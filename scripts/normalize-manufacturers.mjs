/**
 * One-time data cleanup: consolidate manufacturer (brand) spellings that differ
 * only by casing/whitespace into a single canonical spelling.
 *
 * Canonical rule: the most-used spelling wins; ties broken by the earliest-created
 * product. Only casing/whitespace is normalized — accents/punctuation are kept.
 *
 * Idempotent: re-running does nothing once each brand has one spelling.
 *
 * Usage:  node scripts/normalize-manufacturers.mjs          # apply
 *         node scripts/normalize-manufacturers.mjs --dry    # preview only
 */
import 'dotenv/config';
import { Pool } from 'pg';

const dryRun = process.argv.includes('--dry');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const { rows } = await pool.query(
    `SELECT id, manufacturer, created_at FROM products
     WHERE manufacturer IS NOT NULL AND btrim(manufacturer) <> ''`
  );

  // Group by case-insensitive, trimmed key.
  const groups = new Map(); // key → [{ id, manufacturer, created_at }]
  for (const r of rows) {
    const key = r.manufacturer.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r);
  }

  let mergedBrands = 0;
  let updatedProducts = 0;

  for (const [, items] of groups) {
    // Count each distinct (trimmed) spelling + track its earliest created_at.
    const spellings = new Map(); // spelling → { count, earliest }
    for (const it of items) {
      const s = it.manufacturer.trim();
      const cur = spellings.get(s);
      if (!cur) spellings.set(s, { count: 1, earliest: it.created_at });
      else {
        cur.count += 1;
        if (it.created_at < cur.earliest) cur.earliest = it.created_at;
      }
    }

    // Canonical = most-used spelling; tie → earliest created.
    let canonical = null;
    for (const [spelling, { count, earliest }] of spellings) {
      if (
        !canonical ||
        count > canonical.count ||
        (count === canonical.count && earliest < canonical.earliest)
      ) {
        canonical = { spelling, count, earliest };
      }
    }

    // Products whose stored value differs from the canonical (incl. whitespace).
    const toFix = items.filter((it) => it.manufacturer !== canonical.spelling).map((it) => it.id);
    if (toFix.length === 0) continue;

    if (spellings.size > 1) mergedBrands += 1;
    updatedProducts += toFix.length;
    console.log(
      `${dryRun ? '[dry] ' : ''}"${canonical.spelling}" ← merged ${spellings.size} spelling(s), ${toFix.length} product(s) updated`
    );

    if (!dryRun) {
      await pool.query(`UPDATE products SET manufacturer = $1 WHERE id = ANY($2::text[])`, [
        canonical.spelling,
        toFix,
      ]);
    }
  }

  console.log(
    `\n${dryRun ? 'Would consolidate' : 'Consolidated'} ${mergedBrands} brand variation group(s); ${updatedProducts} product(s) ${dryRun ? 'would be' : ''} updated.`
  );
} catch (err) {
  console.error('❌ Failed:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
