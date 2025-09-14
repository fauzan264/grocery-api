/*
  Warnings:

  - You are about to alter the column `price` on the `order_items` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - You are about to alter the column `sub_total` on the `order_items` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - You are about to drop the column `discount` on the `orders` table. All the data in the column will be lost.
  - You are about to alter the column `total_price` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - You are about to alter the column `final_price` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - The primary key for the `product_discounts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `product_discounts` table. All the data in the column will be lost.
  - You are about to drop the column `discount_id` on the `product_discounts` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `product_discounts` table. All the data in the column will be lost.
  - You are about to alter the column `price` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - You are about to alter the column `shipping_cost` on the `shipments` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - You are about to alter the column `price` on the `shopping_cart_items` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - You are about to alter the column `sub_total` on the `shopping_cart_items` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,2)`.
  - You are about to drop the `discounts` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[productId,discountId]` on the table `product_discounts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `discountId` to the `product_discounts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productId` to the `product_discounts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('MANUAL', 'MIN_SPEND', 'BUY_X_GET_Y', 'SEASONAL', 'BUNDLE');

-- DropForeignKey
ALTER TABLE "public"."product_discounts" DROP CONSTRAINT "product_discounts_discount_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_discounts" DROP CONSTRAINT "product_discounts_product_id_fkey";

-- DropIndex
DROP INDEX "public"."product_discounts_product_id_discount_id_key";

-- AlterTable
ALTER TABLE "public"."categories" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."order_items" ADD COLUMN     "applied_discount_id" TEXT,
ADD COLUMN     "discount_amount" DECIMAL(10,2),
ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "sub_total" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."orders" DROP COLUMN "discount",
ADD COLUMN     "discountTotal" DECIMAL(10,2),
ALTER COLUMN "total_price" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "final_price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."product_discounts" DROP CONSTRAINT "product_discounts_pkey",
DROP COLUMN "created_at",
DROP COLUMN "discount_id",
DROP COLUMN "product_id",
ADD COLUMN     "discountId" TEXT NOT NULL,
ADD COLUMN     "productId" TEXT NOT NULL,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "product_discounts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."products" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."shipments" ALTER COLUMN "shipping_cost" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "public"."shopping_cart_items" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "sub_total" SET DATA TYPE DECIMAL(10,2);

-- DropTable
DROP TABLE "public"."discounts";

-- DropEnum
DROP TYPE "public"."discount_type";

-- CreateTable
CREATE TABLE "public"."Discount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isPercentage" BOOLEAN NOT NULL DEFAULT false,
    "value" DECIMAL(10,2) NOT NULL,
    "discountType" "public"."DiscountType" NOT NULL,
    "minSpend" DECIMAL(10,2),
    "buyQuantity" INTEGER,
    "freeQuantity" INTEGER,
    "freeProductId" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "maxUses" INTEGER,
    "perUserLimit" INTEGER,
    "usesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."discount_redemptions" (
    "id" TEXT NOT NULL,
    "discountId" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "discount_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Discount_code_key" ON "public"."Discount"("code");

-- CreateIndex
CREATE INDEX "Discount_isActive_startsAt_endsAt_idx" ON "public"."Discount"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "product_discounts_productId_discountId_key" ON "public"."product_discounts"("productId", "discountId");

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_applied_discount_id_fkey" FOREIGN KEY ("applied_discount_id") REFERENCES "public"."Discount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Discount" ADD CONSTRAINT "Discount_freeProductId_fkey" FOREIGN KEY ("freeProductId") REFERENCES "public"."products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_discounts" ADD CONSTRAINT "product_discounts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_discounts" ADD CONSTRAINT "product_discounts_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "public"."Discount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."discount_redemptions" ADD CONSTRAINT "discount_redemptions_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "public"."Discount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."discount_redemptions" ADD CONSTRAINT "discount_redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."discount_redemptions" ADD CONSTRAINT "discount_redemptions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
