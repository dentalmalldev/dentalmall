-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ACCOUNTANT';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "payment_notes" TEXT,
ADD COLUMN     "payment_verified_at" TIMESTAMP(3),
ADD COLUMN     "payment_verified_by" TEXT;
