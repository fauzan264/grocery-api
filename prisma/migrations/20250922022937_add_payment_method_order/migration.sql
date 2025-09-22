-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('BANK_TRANSFER', 'GOPAY', 'OVO', 'DANA');

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "payment_method" TEXT;
