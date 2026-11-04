/**
 * Checks the stock rules against a real Postgres, using the same helpers the
 * order routes use (src/lib/orders/stock.ts):
 *   1. two checkouts racing for the last unit → exactly one succeeds, stock 0
 *   2. a short line rolls back the whole transaction, earlier decrements included
 *   3. cancelling twice at once → stock comes back exactly once
 *
 * It creates throwaway rows (prefixed stocktest-) and deletes them at the end.
 * It reads STOCK_TEST_DATABASE_URL, never DATABASE_URL, so it can't hit
 * production by accident — point it at a dev branch that has the latest migration.
 *
 * Usage:  STOCK_TEST_DATABASE_URL=postgres://… npx tsx scripts/verify-stock-race.ts
 */
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { decrementStock, restoreStock, InsufficientStockError } from '../src/lib/orders/stock';

const url = process.env.STOCK_TEST_DATABASE_URL;
if (!url) {
  console.error('Set STOCK_TEST_DATABASE_URL to a non-production database.');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString: url })) });
const tag = `stocktest-${Date.now()}`;
let failed = false;

function check(label: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failed = true;
}

async function stockOf(id: string) {
  return (await prisma.products.findUniqueOrThrow({ where: { id }, select: { stock: true } })).stock;
}

async function main() {
  const category = await prisma.categories.create({ data: { name: tag, name_ka: tag, slug: tag } });
  const newProduct = (suffix: string, stock: number) =>
    prisma.products.create({
      data: { name: `${tag}-${suffix}`, name_ka: tag, sku: `${tag}-${suffix}`, price: 10, stock, category_id: category.id },
    });
  const user = await prisma.users.create({
    data: { firebase_uid: tag, email: `${tag}@example.invalid`, first_name: 'Stock', last_name: 'Test' },
  });
  const address = await prisma.addresses.create({
    data: { user_id: user.id, recipient_name: 'Stock Test', mobile_number: '0', city: 'Test', address: 'Test' },
  });

  try {
    // 1. Race for the last unit.
    const last = await newProduct('last', 1);
    const line = [{ product_id: last.id, variant_option_id: null, quantity: 1 }];
    const results = await Promise.allSettled(
      [0, 1].map(() => prisma.$transaction((tx) => decrementStock(tx, line)))
    );
    const won = results.filter((r) => r.status === 'fulfilled').length;
    const short = results.filter(
      (r) => r.status === 'rejected' && r.reason instanceof InsufficientStockError
    ).length;
    check('race: one checkout wins, one is told stock is short', won === 1 && short === 1, `won=${won} short=${short}`);
    check('race: stock ends at 0, never negative', (await stockOf(last.id)) === 0, `stock=${await stockOf(last.id)}`);

    // 2. A short second line rolls back the first line's decrement.
    const plenty = await newProduct('plenty', 5);
    const none = await newProduct('none', 0);
    const rolledBack = await prisma
      .$transaction((tx) =>
        decrementStock(tx, [
          { product_id: plenty.id, variant_option_id: null, quantity: 2 },
          { product_id: none.id, variant_option_id: null, quantity: 1 },
        ])
      )
      .then(() => false, (e) => e instanceof InsufficientStockError && e.item.product_id === none.id);
    check('rollback: short item is named in the error', rolledBack);
    check('rollback: earlier decrement undone', (await stockOf(plenty.id)) === 5, `stock=${await stockOf(plenty.id)}`);

    // 3. Concurrent double cancel restores once.
    const held = await newProduct('held', 3);
    const order = await prisma.$transaction(async (tx) => {
      await decrementStock(tx, [{ product_id: held.id, variant_option_id: null, quantity: 2 }]);
      return tx.orders.create({
        data: {
          order_number: tag, user_id: user.id, address_id: address.id, subtotal: 20, total: 20,
          stock_decremented: true,
          items: { create: [{ product_id: held.id, quantity: 2, price: 10 }] },
        },
      });
    });
    check('order: stock taken at creation', (await stockOf(held.id)) === 1);
    const restored = await Promise.all(
      [0, 1].map(() => prisma.$transaction((tx) => restoreStock(tx, order.id)))
    );
    check('cancel twice: only one call restores', restored.filter(Boolean).length === 1, `restored=${restored}`);
    check('cancel twice: stock back to 3, not 5', (await stockOf(held.id)) === 3, `stock=${await stockOf(held.id)}`);
  } finally {
    await prisma.order_items.deleteMany({ where: { order: { user_id: user.id } } });
    await prisma.orders.deleteMany({ where: { user_id: user.id } });
    await prisma.addresses.deleteMany({ where: { user_id: user.id } });
    await prisma.users.delete({ where: { id: user.id } });
    await prisma.products.deleteMany({ where: { category_id: category.id } });
    await prisma.categories.delete({ where: { id: category.id } });
  }
}

main()
  .catch((e) => {
    console.error(e);
    failed = true;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(failed ? 1 : 0);
  });
