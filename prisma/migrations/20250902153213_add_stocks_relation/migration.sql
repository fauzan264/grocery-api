/*
  Warnings:

  - Changed the type of `status` on the `orders` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."StockChangeType" AS ENUM ('INCREASE', 'DECREASE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "public"."DiscountType" AS ENUM ('MANUAL', 'MIN_SPEND', 'BUY_X_GET_Y');

-- AlterTable
ALTER TABLE "public"."orders" DROP COLUMN "status",
ADD COLUMN     "status" "public"."OrderStatus" NOT NULL;

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(150),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "sku" VARCHAR(50),
    "description" TEXT,
    "price" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "category_id" VARCHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_images" (
    "id" VARCHAR(36) NOT NULL,
    "product_id" VARCHAR(36) NOT NULL,
    "url" VARCHAR(255) NOT NULL,
    "alt_text" VARCHAR(255),
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stocks" (
    "id" VARCHAR(36) NOT NULL,
    "product_id" VARCHAR(36) NOT NULL,
    "store_id" VARCHAR(36) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stock_journals" (
    "id" VARCHAR(36) NOT NULL,
    "stock_id" VARCHAR(36) NOT NULL,
    "change_type" "public"."StockChangeType" NOT NULL,
    "quantity_old" INTEGER NOT NULL,
    "quantity_diff" INTEGER NOT NULL,
    "quantity_new" INTEGER NOT NULL,
    "reason" TEXT,
    "created_by" VARCHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."discounts" (
    "id" VARCHAR(36) NOT NULL,
    "code" VARCHAR(100),
    "name" VARCHAR(150) NOT NULL,
    "discount_type" "public"."DiscountType" NOT NULL,
    "is_percentage" BOOLEAN NOT NULL DEFAULT false,
    "value" INTEGER NOT NULL,
    "min_spend" INTEGER,
    "buy_quantity" INTEGER,
    "free_quantity" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."product_discounts" (
    "id" VARCHAR(36) NOT NULL,
    "product_id" VARCHAR(36) NOT NULL,
    "discount_id" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "public"."categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "public"."categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_name_key" ON "public"."products"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "public"."products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_product_id_store_id_key" ON "public"."stocks"("product_id", "store_id");

-- CreateIndex
CREATE UNIQUE INDEX "discounts_code_key" ON "public"."discounts"("code");

-- CreateIndex
CREATE UNIQUE INDEX "product_discounts_product_id_discount_id_key" ON "public"."product_discounts"("product_id", "discount_id");

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stocks" ADD CONSTRAINT "stocks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stocks" ADD CONSTRAINT "stocks_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_journals" ADD CONSTRAINT "stock_journals_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "public"."stocks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_discounts" ADD CONSTRAINT "product_discounts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_discounts" ADD CONSTRAINT "product_discounts_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "public"."discounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
