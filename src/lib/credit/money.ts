/**
 * Store credit arithmetic. Everything is computed in whole tetri (₾ × 100) so
 * amounts never pick up float error. Client-safe: the cart preview and the
 * checkout transaction apply the same rule.
 */

/** The most a single admin change may add, subtract, or set the balance to. */
export const MAX_CREDIT_CHANGE = 10_000;

type Money = number | string | { toString(): string };

export function toTetri(value: Money): number {
  const n = typeof value === 'number' ? value : parseFloat(value.toString());
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function fromTetri(tetri: number): number {
  return tetri / 100;
}

/** Exact decimal string for a Prisma Decimal column, e.g. 1234 → "12.34". */
export function tetriToDecimal(tetri: number): string {
  return (tetri / 100).toFixed(2);
}

/**
 * Credit an order takes from a balance: as much of the order total (products
 * plus delivery) as the balance covers. Only the first order of a checkout gets
 * any; checkout creates the in-stock order first when there is one.
 */
export function creditForOrder(balance: Money, orderTotal: Money): number {
  return fromTetri(Math.max(0, Math.min(toTetri(balance), toTetri(orderTotal))));
}

/** What the customer pays for an order once its credit is off. Never below 0. */
export function amountToPay(total: Money, creditApplied: Money): number {
  return fromTetri(Math.max(0, toTetri(total) - toTetri(creditApplied)));
}

/** True for an amount with at most two decimals (a whole number of tetri). */
export function hasAtMostTwoDecimals(n: number): boolean {
  return Number.isFinite(n) && Math.abs(Math.round(n * 100) - n * 100) < 1e-6;
}

/** "50" for whole lari, "50.50" otherwise. Used in the congratulation text. */
export function formatLari(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
}
