/*
  Warnings:

  - You are about to drop the column `orderId` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `shopping_carts` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `shopping_carts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id]` on the table `user_addresses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `order_id` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `product_id` to the `order_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `shopping_carts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `user_addresses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."order_items" DROP COLUMN "orderId",
DROP COLUMN "productId",
ADD COLUMN     "order_id" VARCHAR(36) NOT NULL,
ADD COLUMN     "product_id" VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "public"."orders" DROP COLUMN "userId",
ADD COLUMN     "user_id" VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "public"."shopping_carts" DROP COLUMN "isActive",
DROP COLUMN "userId",
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "user_id" VARCHAR(36) NOT NULL;

-- AlterTable
ALTER TABLE "public"."user_addresses" ADD COLUMN     "user_id" VARCHAR(36) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "user_addresses_user_id_key" ON "public"."user_addresses"("user_id");

-- AddForeignKey
ALTER TABLE "public"."user_addresses" ADD CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipments" ADD CONSTRAINT "shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shopping_carts" ADD CONSTRAINT "shopping_carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shopping_cart_items" ADD CONSTRAINT "shopping_cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."shopping_carts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
