/*
  Warnings:

  - A unique constraint covering the columns `[public_id]` on the table `product_images` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."product_images" DROP CONSTRAINT "product_images_product_id_fkey";

-- CreateIndex
CREATE UNIQUE INDEX "product_images_public_id_key" ON "public"."product_images"("public_id");

-- CreateIndex
CREATE INDEX "product_images_product_id_idx" ON "public"."product_images"("product_id");

-- AddForeignKey
ALTER TABLE "public"."product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
