/*
  Warnings:

  - You are about to drop the column `created_at` on the `categories` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `categories` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."categories_slug_key";

-- AlterTable
ALTER TABLE "public"."categories" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "createdBy" VARCHAR(36),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "parentId" VARCHAR(36),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "name" SET DATA TYPE VARCHAR(200),
ALTER COLUMN "slug" SET DATA TYPE VARCHAR(200);

-- CreateTable
CREATE TABLE "public"."category_logs" (
    "id" VARCHAR(36) NOT NULL,
    "categoryId" VARCHAR(36) NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB,
    "performedBy" VARCHAR(36),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_logs_categoryId_idx" ON "public"."category_logs"("categoryId");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "public"."categories"("parentId");

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
