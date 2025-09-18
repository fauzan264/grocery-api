/*
  Warnings:

  - A unique constraint covering the columns `[user_id,is_default]` on the table `user_addresses` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `district` to the `user_addresses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."stores" ADD COLUMN     "district" VARCHAR(100);

-- AlterTable
ALTER TABLE "public"."user_addresses" ADD COLUMN     "district" VARCHAR(100) NOT NULL,
ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "unique_user_default" ON "public"."user_addresses"("user_id", "is_default");
