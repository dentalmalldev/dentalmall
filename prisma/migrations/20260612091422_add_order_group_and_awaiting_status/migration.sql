-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'AWAITING_ADMIN_CONFIRMATION';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "order_group_id" TEXT;

-- CreateIndex
CREATE INDEX "orders_order_group_id_idx" ON "orders"("order_group_id");
