/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `shipments` table. All the data in the column will be lost.
  - You are about to drop the column `tracking_number` on the `shipments` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `shipments` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."shipments_tracking_number_key";

-- AlterTable
ALTER TABLE "public"."shipments" DROP COLUMN "deleted_at",
DROP COLUMN "tracking_number",
DROP COLUMN "updated_at";
