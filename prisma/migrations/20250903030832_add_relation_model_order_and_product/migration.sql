/*
  Warnings:

  - The `status` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `discount_type` on the `discounts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `change_type` on the `stock_journals` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `stores` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `user_role` on the `users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."user_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."user_roles" AS ENUM ('SUPER_ADMIN', 'ADMIN_STORE', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "public"."store_status" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."order_status" AS ENUM ('WAITING_FOR_PAYMENT', 'WAITING_CONFIRMATION_PAYMENT', 'IN_PROCESS', 'DELIVERED', 'ORDER_CONFIRMATION', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."stock_change_type" AS ENUM ('INCREASE', 'DECREASE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."discount_type" AS ENUM ('MANUAL', 'MIN_SPEND', 'BUY_X_GET_Y');

-- AlterTable
ALTER TABLE "public"."discounts" DROP COLUMN "discount_type",
ADD COLUMN     "discount_type" "public"."discount_type" NOT NULL;

-- AlterTable
ALTER TABLE "public"."orders" DROP COLUMN "status",
ADD COLUMN     "status" "public"."order_status" NOT NULL;

-- AlterTable
ALTER TABLE "public"."stock_journals" DROP COLUMN "change_type",
ADD COLUMN     "change_type" "public"."stock_change_type" NOT NULL;

-- AlterTable
ALTER TABLE "public"."stores" DROP COLUMN "status",
ADD COLUMN     "status" "public"."store_status" NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "password" DROP NOT NULL,
ALTER COLUMN "phone_number" DROP NOT NULL,
ALTER COLUMN "photo_profile" DROP NOT NULL,
ALTER COLUMN "verified" DROP NOT NULL,
DROP COLUMN "user_role",
ADD COLUMN     "user_role" "public"."user_roles" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."user_status" NOT NULL DEFAULT 'INACTIVE';

-- DropEnum
DROP TYPE "public"."DiscountType";

-- DropEnum
DROP TYPE "public"."OrderStatus";

-- DropEnum
DROP TYPE "public"."StockChangeType";

-- DropEnum
DROP TYPE "public"."StoreStatus";

-- DropEnum
DROP TYPE "public"."UserRole";

-- DropEnum
DROP TYPE "public"."UserStatus";

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
