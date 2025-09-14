-- AlterTable
ALTER TABLE "public"."Discount" ADD COLUMN     "getQuantity" INTEGER,
ADD COLUMN     "maxUsesPerUser" INTEGER,
ADD COLUMN     "productId" TEXT;

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "appliedDiscountIds" TEXT[];

-- AddForeignKey
ALTER TABLE "public"."Discount" ADD CONSTRAINT "Discount_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
