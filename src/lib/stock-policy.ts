/**
 * Temporary switch, off since 2026-11-10: stock limits don't apply.
 *
 * While false:
 *  - customers see no stock counts and no "out of stock" anywhere,
 *  - any quantity can be added to the cart and ordered,
 *  - checkout leaves stock figures untouched (orders are created with
 *    stock_decremented = false, so cancelling one doesn't add stock back).
 * Back-office pages still show and edit stock as before.
 *
 * Set to true to bring every stock rule back. Safe to import from client and
 * server code alike.
 */
export const STOCK_LIMITS_ENABLED: boolean = false;
