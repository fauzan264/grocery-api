/*
  Warnings:

  - A unique constraint covering the columns `[number]` on the table `orders` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "number" VARCHAR(36);

-- CreateIndex
CREATE UNIQUE INDEX "orders_number_key" ON "public"."orders"("number");
