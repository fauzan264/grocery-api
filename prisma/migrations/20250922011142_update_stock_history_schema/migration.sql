/*
  Warnings:

  - You are about to drop the `StockHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."StockHistory" DROP CONSTRAINT "StockHistory_stockId_fkey";

-- DropForeignKey
ALTER TABLE "public"."StockHistory" DROP CONSTRAINT "StockHistory_userId_fkey";

-- DropTable
DROP TABLE "public"."StockHistory";

-- CreateTable
CREATE TABLE "public"."stock_history" (
    "id" VARCHAR(36) NOT NULL,
    "stock_id" VARCHAR(36) NOT NULL,
    "quantity_old" INTEGER NOT NULL,
    "quantity_diff" INTEGER NOT NULL,
    "quantity_new" INTEGER NOT NULL,
    "note" TEXT,
    "created_by" VARCHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "change_type" "public"."stock_change_type" NOT NULL,
    "journal_type" "public"."stock_journal_type",

    CONSTRAINT "stock_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."stock_history" ADD CONSTRAINT "stock_history_stock_id_fkey" FOREIGN KEY ("stock_id") REFERENCES "public"."Stock"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
