-- CreateEnum
CREATE TYPE "public"."stock_journal_type" AS ENUM ('PURCHASE', 'SALE', 'RETURN', 'TRANSFER', 'ADJUSTMENT', 'OTHER');

-- AlterTable
ALTER TABLE "public"."products" ADD COLUMN     "weight_g" INTEGER;

-- AlterTable
ALTER TABLE "public"."stock_journals" ADD COLUMN     "journal_type" "public"."stock_journal_type";
