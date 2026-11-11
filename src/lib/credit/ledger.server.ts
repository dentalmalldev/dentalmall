import { Prisma } from '@prisma/client';
import { toTetri, tetriToDecimal } from './money';

/**
 * The only code that changes users.credit_balance. Every change writes its
 * credit_transactions row in the same transaction, so balance and history can't
 * drift. Callers pass their interactive-transaction client.
 *
 * Concurrency: a balance is read with SELECT … FOR UPDATE, so a second
 * checkout or admin change on the same user waits for the first to commit and
 * then sees the new balance. Increments use a single UPDATE. The database also
 * refuses a negative balance (CHECK constraint in the migration).
 */

type Tx = Prisma.TransactionClient;

export type AdminCreditChangeType = 'ADD' | 'SUBTRACT' | 'SET';

export class CreditChangeError extends Error {
  constructor(public readonly code: 'USER_NOT_FOUND' | 'NEGATIVE_BALANCE') {
    super(code);
    this.name = 'CreditChangeError';
  }
}

/** Locks the user's row for the rest of the transaction; balance in tetri, or null. */
async function lockBalance(tx: Tx, userId: string): Promise<number | null> {
  const rows = await tx.$queryRaw<{ balance: string }[]>`
    SELECT credit_balance::text AS balance FROM users WHERE id = ${userId} FOR UPDATE
  `;
  return rows.length > 0 ? toTetri(rows[0].balance) : null;
}

/**
 * An admin adds, subtracts, or sets the balance. Throws CreditChangeError when
 * the user is missing or the result would be below 0. Amount limits and the
 * note are validated by the route (src/lib/validations/credit.ts).
 */
export async function changeCreditByAdmin(
  tx: Tx,
  params: { userId: string; adminId: string; type: AdminCreditChangeType; amount: number; note: string }
) {
  const before = await lockBalance(tx, params.userId);
  if (before === null) throw new CreditChangeError('USER_NOT_FOUND');

  const amount = toTetri(params.amount);
  const after =
    params.type === 'ADD' ? before + amount : params.type === 'SUBTRACT' ? before - amount : amount;
  if (after < 0) throw new CreditChangeError('NEGATIVE_BALANCE');

  await tx.users.update({
    where: { id: params.userId },
    data: { credit_balance: tetriToDecimal(after) },
  });

  return tx.credit_transactions.create({
    data: {
      user_id: params.userId,
      admin_id: params.adminId,
      type: `ADMIN_${params.type}`,
      amount: tetriToDecimal(after - before),
      balance_after: tetriToDecimal(after),
      note: params.note,
    },
  });
}

/**
 * Checkout: takes as much of `orderTotal` as the balance covers and returns
 * what was taken (tetri). Call before creating the order, then
 * recordCreditUse() once the order exists. Both in the checkout transaction.
 */
export async function takeCreditForOrder(
  tx: Tx,
  userId: string,
  orderTotal: number
): Promise<{ takenTetri: number; balanceAfterTetri: number }> {
  // One round trip: lock the row (waiting for any other checkout or admin
  // change), then take LEAST(balance, total). Checkout runs in a timed
  // transaction, so fewer round trips matter.
  const total = tetriToDecimal(Math.max(0, toTetri(orderTotal)));
  const rows = await tx.$queryRaw<{ before: string; after: string }[]>`
    WITH old AS (
      SELECT id, credit_balance FROM users WHERE id = ${userId} AND credit_balance > 0 FOR UPDATE
    )
    UPDATE users AS u
    SET credit_balance = old.credit_balance - LEAST(old.credit_balance, ${total}::numeric),
        updated_at = CURRENT_TIMESTAMP
    FROM old
    WHERE u.id = old.id
    RETURNING old.credit_balance::text AS before, u.credit_balance::text AS after
  `;
  if (rows.length === 0) return { takenTetri: 0, balanceAfterTetri: 0 };

  const before = toTetri(rows[0].before);
  const after = toTetri(rows[0].after);
  return { takenTetri: before - after, balanceAfterTetri: after };
}

/** History row for credit taken at checkout (see takeCreditForOrder). */
export async function recordCreditUse(
  tx: Tx,
  params: { userId: string; orderId: string; takenTetri: number; balanceAfterTetri: number }
) {
  if (params.takenTetri <= 0) return;
  await tx.credit_transactions.create({
    data: {
      user_id: params.userId,
      order_id: params.orderId,
      type: 'ORDER_USED',
      amount: tetriToDecimal(-params.takenTetri),
      balance_after: tetriToDecimal(params.balanceAfterTetri),
    },
  });
}

/**
 * A cancelled or fully refunded order gives its credit back, once: flipping
 * credit_returned is the guard, so a repeated (or concurrent, which waits on the
 * row lock) call finds nothing to return. Returns the amount returned (tetri).
 */
export async function returnOrderCredit(tx: Tx, orderId: string): Promise<number> {
  const { count } = await tx.orders.updateMany({
    where: { id: orderId, credit_returned: false, credit_applied: { gt: 0 } },
    data: { credit_returned: true },
  });
  if (count === 0) return 0;

  const order = await tx.orders.findUniqueOrThrow({
    where: { id: orderId },
    select: { user_id: true, credit_applied: true },
  });
  const amount = toTetri(order.credit_applied);
  await creditBack(tx, order.user_id, orderId, amount);
  return amount;
}

/**
 * When an order's total drops below the credit applied to it (a special order
 * repriced at confirmation), the part that no longer fits goes back to the
 * balance. Otherwise the applied credit stays as it is. Returns tetri returned.
 */
export async function fitOrderCreditToTotal(tx: Tx, orderId: string, newTotal: number): Promise<number> {
  const order = await tx.orders.findUniqueOrThrow({
    where: { id: orderId },
    select: { user_id: true, credit_applied: true, credit_returned: true },
  });
  if (order.credit_returned) return 0;

  const excess = toTetri(order.credit_applied) - toTetri(newTotal);
  if (excess <= 0) return 0;

  await tx.orders.update({
    where: { id: orderId },
    data: { credit_applied: tetriToDecimal(toTetri(order.credit_applied) - excess) },
  });
  await creditBack(tx, order.user_id, orderId, excess);
  return excess;
}

async function creditBack(tx: Tx, userId: string, orderId: string, amountTetri: number) {
  const user = await tx.users.update({
    where: { id: userId },
    data: { credit_balance: { increment: tetriToDecimal(amountTetri) } },
    select: { credit_balance: true },
  });
  await tx.credit_transactions.create({
    data: {
      user_id: userId,
      order_id: orderId,
      type: 'ORDER_RETURNED',
      amount: tetriToDecimal(amountTetri),
      balance_after: user.credit_balance,
    },
  });
}
