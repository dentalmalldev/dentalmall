-- CreateEnum
CREATE TYPE "ProductRequestStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'DONE', 'REJECTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "phone_number" TEXT;

-- CreateTable
CREATE TABLE "product_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_request_items" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "invoice_name" TEXT,
    "description" TEXT NOT NULL,
    "estimated_price" TEXT NOT NULL,
    "store" TEXT NOT NULL,
    "photo_url" TEXT,
    "quantity" INTEGER NOT NULL,
    "status" "ProductRequestStatus" NOT NULL DEFAULT 'NEW',
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_request_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_requests_user_id_created_at_idx" ON "product_requests"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "product_request_items_request_id_idx" ON "product_request_items"("request_id");

-- CreateIndex
CREATE INDEX "product_request_items_status_created_at_idx" ON "product_request_items"("status", "created_at");

-- CreateIndex
CREATE INDEX "product_request_items_created_at_idx" ON "product_request_items"("created_at");

-- AddForeignKey
ALTER TABLE "product_requests" ADD CONSTRAINT "product_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_request_items" ADD CONSTRAINT "product_request_items_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "product_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: give each user the number from their default address, otherwise from
-- the address they changed most recently. Only the new column is written, so
-- users.updated_at and every other value stay as they are.
UPDATE "users" AS u
SET "phone_number" = a."mobile_number"
FROM (
    SELECT DISTINCT ON ("user_id") "user_id", TRIM("mobile_number") AS "mobile_number"
    FROM "addresses"
    WHERE TRIM("mobile_number") <> ''
    ORDER BY "user_id", "is_default" DESC, "updated_at" DESC
) AS a
WHERE u."id" = a."user_id";
