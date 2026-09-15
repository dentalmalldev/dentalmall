/**
 * `dentalmall_price` is the cost DentalMall sources a product (or variant
 * option) for. It is meaningful to admins and vendors only — a public
 * response must never carry it. Rather than trusting every `select` and
 * `include` in every public route to remember, payloads are passed through
 * this once, right before serialisation.
 *
 * Only plain objects and arrays are walked; Prisma Decimals, Dates and other
 * class instances are left untouched so they still serialise normally.
 */
const COST_FIELD = 'dentalmall_price';

export function stripCostPrices<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripCostPrices) as T;
  }
  if (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (key === COST_FIELD) continue;
      out[key] = stripCostPrices(nested);
    }
    return out as T;
  }
  return value;
}
