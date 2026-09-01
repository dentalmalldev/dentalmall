-- AlterTable: buffer state for stores (hidden until published)
ALTER TABLE "vendors" ADD COLUMN "is_published" BOOLEAN NOT NULL DEFAULT false;

-- Existing stores were already publicly visible — keep them that way.
-- Only stores created from now on start in the buffer.
UPDATE "vendors" SET "is_published" = true;
