import { Prisma } from '@prisma/client';

// Once an order reaches one of these, its goods have left the warehouse:
// cancelling or refunding it no longer puts anything back on the shelf.
export const LEFT_WAREHOUSE_STATUSES = ['OUT_FOR_DELIVERY', 'SHIPPED', 'DELIVERED'] as const;

export const CANCELLED_STATUSES: readonly string[] = ['CANCELLED', 'CANCELLED_UNAVAILABLE'];

interface StockLine {
  product_id: string;
  variant_option_id: string | null;
  quantity: number;
}

export interface ShortItem {
  product_id: string;
  name: string;
  name_ka: string;
  variant_name: string | null;
  variant_name_ka: string | null;
  available: number;
}

export class InsufficientStockError extends Error {
  constructor(public readonly item: ShortItem) {
    super(`Insufficient stock for ${item.name}${item.variant_name ? ` (${item.variant_name})` : ''}`);
  }
}

// Lines carrying a variant draw on the option's stock, all others on the product's.
// Sorting by this key makes every transaction lock stock rows in the same order,
// so two checkouts sharing products can't deadlock each other.
function stockKey(line: StockLine) {
  return line.variant_option_id ? `v:${line.variant_option_id}` : `p:${line.product_id}`;
}

/**
 * Takes each line's quantity off stock. Each decrement only applies while enough
 * stock is left, and Postgres re-checks that condition after the row lock, so
 * two concurrent orders can't both take the last unit. Throws
 * InsufficientStockError on the first short line; the caller's transaction then
 * rolls back every decrement made before it.
 */
export async function decrementStock(tx: Prisma.TransactionClient, lines: StockLine[]) {
  const sorted = [...lines].sort((a, b) => stockKey(a).localeCompare(stockKey(b)));

  for (const line of sorted) {
    const { count } = line.variant_option_id
      ? await tx.variant_options.updateMany({
          where: { id: line.variant_option_id, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        })
      : await tx.products.updateMany({
          where: { id: line.product_id, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } },
        });

    if (count === 0) {
      const product = await tx.products.findUniqueOrThrow({
        where: { id: line.product_id },
        select: { name: true, name_ka: true, stock: true },
      });
      const option = line.variant_option_id
        ? await tx.variant_options.findUnique({
            where: { id: line.variant_option_id },
            select: { name: true, name_ka: true, stock: true },
          })
        : null;

      throw new InsufficientStockError({
        product_id: line.product_id,
        name: product.name,
        name_ka: product.name_ka,
        variant_name: option?.name ?? null,
        variant_name_ka: option?.name_ka ?? null,
        available: Math.max(0, option ? option.stock : product.stock),
      });
    }
  }
}

/**
 * Puts an order's decremented stock back, at most once: clearing the
 * stock_decremented flag is the guard, so a second call (or a concurrent one,
 * which waits on the row lock) finds nothing to restore. Nothing is restored once
 * the goods have left the warehouse. Call this inside the transaction that sets
 * the cancelled status, before the status changes. Returns whether stock moved.
 */
export async function restoreStock(tx: Prisma.TransactionClient, orderId: string) {
  const { count } = await tx.orders.updateMany({
    where: {
      id: orderId,
      stock_decremented: true,
      status: { notIn: [...LEFT_WAREHOUSE_STATUSES] },
    },
    data: { stock_decremented: false },
  });
  if (count === 0) return false;

  const items = await tx.order_items.findMany({ where: { order_id: orderId } });
  const sorted = [...items].sort((a, b) => stockKey(a).localeCompare(stockKey(b)));

  for (const item of sorted) {
    if (item.variant_option_id) {
      await tx.variant_options.updateMany({
        where: { id: item.variant_option_id },
        data: { stock: { increment: item.quantity } },
      });
    } else if (!item.variant_name) {
      await tx.products.update({
        where: { id: item.product_id },
        data: { stock: { increment: item.quantity } },
      });
    }
    // A variant line whose option has since been deleted (variant_option_id
    // nulled, variant_name kept) has no stock row left to return to.
  }

  return true;
}
