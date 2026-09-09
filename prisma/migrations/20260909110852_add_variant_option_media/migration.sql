-- AlterTable
ALTER TABLE "media" ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "variant_option_id" TEXT;

-- CreateIndex
CREATE INDEX "media_product_id_idx" ON "media"("product_id");

-- CreateIndex
CREATE INDEX "media_variant_option_id_idx" ON "media"("variant_option_id");

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_variant_option_id_fkey" FOREIGN KEY ("variant_option_id") REFERENCES "variant_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
