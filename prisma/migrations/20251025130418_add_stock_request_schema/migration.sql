-- CreateEnum
CREATE TYPE "public"."StockRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."StockRequest" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "quantityRequested" INTEGER NOT NULL,
    "status" "public"."StockRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "StockRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."StockRequest" ADD CONSTRAINT "StockRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockRequest" ADD CONSTRAINT "StockRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockRequest" ADD CONSTRAINT "StockRequest_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
