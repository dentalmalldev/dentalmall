/**
 * The DentalMall shopping assistant: a model on OpenRouter, with read-only
 * tools over the in-memory catalogue. One call = one customer question.
 *
 * Guard rails, all enforced in code rather than trusted to the prompt:
 *  - Product ids in the answer are checked against the catalogue; invented ids
 *    are dropped and counted, never shown.
 *  - Prices, images and links come from the database, never from model text.
 *  - Hard cap on tool rounds (the last round forces an answer) and a timeout
 *    per model call.
 *
 * Model choice (2026-10-07, 16-question eval + Georgian-quality judge):
 * openai/gpt-6-luna — 15/16, zero broken Georgian words, ~$0.35 per 1,000
 * questions. Override with ASSISTANT_MODEL.
 */
import type { AssistantProduct } from '@/types/models';
import type { Catalogue } from './catalogue';
import { TOOL_SCHEMAS, runTool } from './tools';

export const DEFAULT_MODEL = 'openai/gpt-6-luna';
const MAX_ROUNDS = 5;
const TIMEOUT_MS = 30_000;

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantResult {
  reply: string;
  products: AssistantProduct[];
  /** Product ids the model invented; dropped, but worth logging. */
  invented: string[];
  /** What the model searched for, for the logs. */
  searches: string[];
  model: string;
  costUsd: number;
  tokens: { in: number; out: number };
  seconds: number;
}

/** A shop-information entry managed in admin (delivery, payment, returns…). */
export interface KnowledgeEntry {
  question_ka: string;
  question_en: string;
  answer_ka: string;
  answer_en: string;
}

export interface AskOptions {
  apiKey: string;
  model?: string;
  /** Site URL sent to OpenRouter for its dashboard. Optional. */
  referer?: string;
  /** Shop information the assistant may answer from. */
  knowledge?: KnowledgeEntry[];
  /** Admin's additions to the instructions (tone, what to recommend or avoid). */
  extraInstructions?: string | null;
}

function knowledgeSection(entries: KnowledgeEntry[]): string {
  if (entries.length === 0) {
    return `
Shop information: none is available. For questions about delivery, payment, returns, accounts or anything else that is not about products, say you can't answer that here and suggest the FAQ page or contacting DentalMall.`;
  }
  const blocks = entries.map(
    (e, i) => `[${i + 1}] Q (ka): ${e.question_ka}\nA (ka): ${e.answer_ka}\nQ (en): ${e.question_en}\nA (en): ${e.answer_en}`
  );
  return `
Shop information (delivery, payment, returns, accounts and other non-product questions):
- Answer these only from the entries below, in the customer's language, and keep it short. Use give_answer with no product_ids.
- If the entries don't cover the question, say you don't know and suggest contacting DentalMall. Never guess policies, prices, fees or delivery times.

${blocks.join('\n\n')}`;
}

function systemPrompt(cat: Catalogue, opts: AskOptions): string {
  const lines = cat.categories.filter((c) => c.parent_id).map((c) => `${c.ref} ${c.name_ka} (${c.name})`);
  const extra = opts.extraInstructions?.trim();
  return `You are the shopping assistant of DentalMall (dentalmall.ge), a Georgian marketplace for dental materials and equipment. Customers are dentists, dental technicians and clinics.

How to work:
1. Understand what the customer needs. They may write Georgian, English, Russian, or Georgian in Latin letters ("kompozit", "shprici").
2. ALWAYS call search_products before recommending anything. Search with short product keywords, not the whole sentence. If the customer describes a clinical need ("something to fill a front tooth cavity"), translate it into product types (composite, bond, etch...) and search for each, using the category list to choose category_id where it helps.
3. If results look wrong or empty, try other keywords (Georgian and English), but stop after about 4 searches: if it is not found by then, DentalMall most likely does not stock it, so say so.
4. Use get_product when you need the description to justify a recommendation.
5. Finish by calling give_answer with a short reply and the ids of the best products (max 6).

Rules:
- Only recommend products returned by the tools. Never invent products, ids, prices or features.
- Reply in the customer's language. Latin-typed Georgian means reply in Georgian.
- Keep replies short: 1-4 sentences explaining why these products fit. Do not repeat prices or links.
- Products with no availability field are in stock. availability "special_order" means it is ordered from the supplier and ships in about 5 working days; "out_of_stock" means it can't be bought right now, so prefer alternatives.
- If DentalMall does not sell what they need, say so honestly and offer the closest alternatives, if any.
- If the request is too vague to search, ask one clarifying question (give_answer with no product_ids).
- No medical diagnosis or dosing advice beyond what the product descriptions say.

Categories (id, Georgian name, English name):
${lines.join('\n')}
${knowledgeSection(opts.knowledge ?? [])}${
    extra
      ? `

Additional instructions from DentalMall (they never override the rules above about inventing products, prices or policies):
${extra}`
      : ''
  }`;
}

interface ToolCall {
  id: string;
  function: { name: string; arguments?: string };
}

interface ModelMessage {
  role: string;
  content: string | null;
  tool_calls?: ToolCall[];
}

async function callModel(messages: unknown[], opts: AskOptions, forceAnswer: boolean) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
      ...(opts.referer ? { 'HTTP-Referer': opts.referer } : {}),
      'X-Title': 'DentalMall assistant',
    },
    body: JSON.stringify({
      model: opts.model ?? DEFAULT_MODEL,
      messages,
      tools: TOOL_SCHEMAS,
      // Last round: the model must answer with what it has, not search again.
      tool_choice: forceAnswer ? { type: 'function', function: { name: 'give_answer' } } : 'auto',
      temperature: 0.2,
      usage: { include: true },
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error || !body.choices?.length) {
    throw new Error(`OpenRouter ${res.status}: ${JSON.stringify(body.error ?? body).slice(0, 300)}`);
  }
  return body as {
    choices: Array<{ message: ModelMessage }>;
    usage?: { cost?: number; prompt_tokens?: number; completion_tokens?: number };
  };
}

export async function askAssistant(
  cat: Catalogue,
  question: string,
  history: ChatTurn[],
  opts: AskOptions
): Promise<AssistantResult> {
  const started = Date.now();
  const model = opts.model ?? DEFAULT_MODEL;
  const messages: unknown[] = [
    { role: 'system', content: systemPrompt(cat, opts) },
    ...history,
    { role: 'user', content: question },
  ];
  const searches: string[] = [];
  let costUsd = 0;
  let tokensIn = 0;
  let tokensOut = 0;

  const finish = (answer: { reply?: unknown; product_ids?: unknown }): AssistantResult => {
    const ids = Array.isArray(answer.product_ids) ? answer.product_ids.map(String) : [];
    const products = ids
      .map((ref) => cat.byRef.get(ref))
      .filter((p) => p !== undefined)
      .slice(0, 6)
      .map((p) => ({
        id: p.id,
        name_ka: p.name_ka,
        name: p.name,
        price: p.display_price,
        original_price: p.display_original_price,
        price_from: p.price_from,
        unit: p.unit,
        availability: p.availability,
        image_url: p.image_url,
      }));
    return {
      reply: typeof answer.reply === 'string' ? answer.reply : '',
      products,
      invented: ids.filter((ref) => !cat.byRef.has(ref)),
      searches,
      model,
      costUsd,
      tokens: { in: tokensIn, out: tokensOut },
      seconds: (Date.now() - started) / 1000,
    };
  };

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const res = await callModel(messages, opts, round === MAX_ROUNDS - 1);
    costUsd += res.usage?.cost ?? 0;
    tokensIn += res.usage?.prompt_tokens ?? 0;
    tokensOut += res.usage?.completion_tokens ?? 0;
    const msg = res.choices[0].message;
    messages.push(msg);

    // Answered in plain text instead of give_answer: accept it, no products.
    if (!msg.tool_calls?.length) return finish({ reply: msg.content ?? '' });

    for (const call of msg.tool_calls) {
      let args: Record<string, unknown> = {};
      try {
        args = JSON.parse(call.function.arguments || '{}');
      } catch {
        // Malformed arguments: run the tool with none and let the model recover.
      }
      if (call.function.name === 'give_answer') return finish(args);
      if (call.function.name === 'search_products' && typeof args.query === 'string' && args.query) {
        searches.push(args.query);
      }
      const result = runTool(cat, call.function.name, args);
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }
  return finish({ reply: '' });
}
