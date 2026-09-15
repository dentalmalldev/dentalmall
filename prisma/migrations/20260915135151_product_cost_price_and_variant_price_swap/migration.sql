-- AlterTable
ALTER TABLE "products" ADD COLUMN     "dentalmall_price" DECIMAL(10,2);

-- Data: the meaning of the two variant price columns is being flipped.
-- Until now `dentalmall_price` held the customer-facing selling price and
-- `price` held the vendor cost. From this migration on it is the other way
-- round (`price` = selling, `dentalmall_price` = cost), matching the products
-- table and the upload template. Swap the values so existing rows keep
-- meaning what they meant. Postgres evaluates the right-hand side against
-- the old row, so a single UPDATE swaps both columns atomically.
UPDATE "variant_options"
SET "price" = "dentalmall_price",
    "dentalmall_price" = "price"
WHERE "price" <> "dentalmall_price";
