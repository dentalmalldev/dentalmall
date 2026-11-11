-- CreateEnum
CREATE TYPE "CreditTransactionType" AS ENUM ('ADMIN_ADD', 'ADMIN_SUBTRACT', 'ADMIN_SET', 'ORDER_USED', 'ORDER_RETURNED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "credit_balance" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "credit_applied" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "credit_returned" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "credit_transactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "admin_id" TEXT,
    "order_id" TEXT,
    "type" "CreditTransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "balance_after" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credit_transactions_user_id_created_at_idx" ON "credit_transactions"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Guards (hand-written; Prisma doesn't model CHECK constraints): whatever the
-- code does, a balance or an order's applied credit can never go below 0.
ALTER TABLE "users" ADD CONSTRAINT "users_credit_balance_nonnegative" CHECK ("credit_balance" >= 0);
ALTER TABLE "orders" ADD CONSTRAINT "orders_credit_applied_nonnegative" CHECK ("credit_applied" >= 0);
