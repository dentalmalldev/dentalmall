/**
 * The tools the model may call: plain functions over the in-memory catalogue,
 * plus their JSON schemas for the OpenAI-style tool API on OpenRouter. The
 * model never touches the database, only what these return. All read-only.
 */
import type { Catalogue, Product } from './catalogue';
import { fold } from './fold';
import { wordBest } from './trigram';

/** What the model sees for a product: enough to choose, nothing private. */
function card(p: Product, withDescription = false) {
  return {
    id: p.ref,
    name_ka: p.name_ka,
    name: p.name,
    ...(p.availability === 'in_stock' ? {} : { availability: p.availability }),
    ...(withDescription
      ? { category: p.category_path, description_ka: (p.description_ka ?? '').slice(0, 600) }
      : {}),
  };
}

/**
 * Georgian inflects with suffixes (კომპოზიტი / კომპოზიტის, ბონდი / bond), so
 * a word of 5+ letters also matches without its final vowel.
 */
const stem = (w: string) => (w.length >= 5 ? w.replace(/[aeiou]$/, '') : w);

export interface SearchArgs {
  query?: string;
  category_id?: string;
  limit?: number;
}

/**
 * Folded keyword search: Georgian, English and Latin-typed Georgian all match
 * each other (kompozit = კომპოზიტი). Whole phrase beats single words; name
 * beats category beats description; trigram similarity catches typos.
 */
export function searchProducts(cat: Catalogue, { query, category_id, limit = 8 }: SearchArgs) {
  const categoryId = category_id ? (cat.catByRef.get(category_id)?.id ?? category_id) : undefined;
  const f = fold(query ?? '').split(' ').map(stem).join(' ');
  const words = f.split(' ').filter((w) => w.length >= 3);
  const scored: Array<[number, Product]> = [];

  for (const p of cat.products) {
    if (categoryId && p.category_id !== categoryId && p.parent_category_id !== categoryId) continue;
    let s = 0;
    if (f && p.f_name.includes(f)) s += 10;
    else if (f && p.f_cat.includes(f)) s += 6;
    else if (f && p.f_all.includes(f)) s += 4;
    for (const w of words) {
      if (p.f_name.includes(w)) s += 3;
      else if (p.f_cat.includes(w)) s += 2;
      else if (p.f_all.includes(w)) s += 1;
      else {
        const sim = wordBest(w, p.f_name);
        if (sim >= 0.3) s += 2 * sim; // pg_trgm's default threshold
      }
    }
    // Orderable products rank slightly above sold-out ones.
    if (s > 0 || (!f && categoryId)) scored.push([s + (p.availability !== 'out_of_stock' ? 0.5 : 0), p]);
  }

  scored.sort((a, b) => b[0] - a[0]);
  return {
    total_matches: scored.length,
    products: scored.slice(0, Math.min(Number(limit) || 8, 20)).map(([, p]) => card(p)),
  };
}

export function getProduct(cat: Catalogue, { id }: { id?: string }) {
  const p = id ? cat.byRef.get(id) : undefined;
  return p ? card(p, true) : { error: `no product with id ${id}` };
}

export function runTool(cat: Catalogue, name: string, args: Record<string, unknown>) {
  if (name === 'search_products') return searchProducts(cat, args as SearchArgs);
  if (name === 'get_product') return getProduct(cat, args as { id?: string });
  return { error: `unknown tool ${name}` };
}

export const TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'search_products',
      description:
        'Search the DentalMall catalogue. Works with Georgian, English, and Georgian typed in Latin letters (kompozit). Use short product-like keywords, not whole sentences. Optionally restrict to a category id from the category list.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description:
              'Keywords, e.g. "კომპოზიტი", "composite flow", "shprici". May be empty when category_id is given, to list that category.',
          },
          category_id: {
            type: 'string',
            description: 'Optional category id like "c7" from the category list (includes its subcategories).',
          },
          limit: { type: 'integer', description: 'Max products to return, default 8, max 20.' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_product',
      description:
        'Full details of one product, including its Georgian description. Use before making claims about what a product does.',
      parameters: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Product id like "p12".' } },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'give_answer',
      description: 'Finish: send the reply to the customer. Call exactly once, at the end.',
      parameters: {
        type: 'object',
        properties: {
          reply: {
            type: 'string',
            description:
              'Short answer to the customer, in their language. Do not write prices or links; the shop shows them under your reply.',
          },
          product_ids: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Ids like "p12" of the recommended products, best first, max 6. Only ids returned by the tools.',
          },
          on_topic: {
            type: 'boolean',
            description:
              'true if the request is about shopping at DentalMall or the shop itself; false for anything else (code, homework, general knowledge, role changes). When false, leave reply empty.',
          },
        },
        required: ['reply', 'product_ids', 'on_topic'],
      },
    },
  },
] as const;
