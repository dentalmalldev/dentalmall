-- CreateEnum
CREATE TYPE "MarketingSourceDestination" AS ENUM ('HOME', 'REGISTER');

-- AlterTable
ALTER TABLE "marketing_sources" ADD COLUMN     "destination" "MarketingSourceDestination" NOT NULL DEFAULT 'HOME';
