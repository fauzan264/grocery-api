/*
  Warnings:

  - You are about to drop the column `city` on the `stores` table. All the data in the column will be lost.
  - You are about to drop the column `district` on the `stores` table. All the data in the column will be lost.
  - You are about to drop the column `province` on the `stores` table. All the data in the column will be lost.
  - You are about to drop the column `subdistrict` on the `stores` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `district` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `province` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the column `subdistrict` on the `user_addresses` table. All the data in the column will be lost.
  - You are about to drop the `subdistricts` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `city_id` to the `stores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district_id` to the `stores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province_id` to the `stores` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city_id` to the `user_addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district_id` to the `user_addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province_id` to the `user_addresses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."subdistricts" DROP CONSTRAINT "subdistricts_districtId_fkey";

-- AlterTable
ALTER TABLE "public"."stores" DROP COLUMN "city",
DROP COLUMN "district",
DROP COLUMN "province",
DROP COLUMN "subdistrict",
ADD COLUMN     "city_id" INTEGER NOT NULL,
ADD COLUMN     "district_id" INTEGER NOT NULL,
ADD COLUMN     "province_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."user_addresses" DROP COLUMN "city",
DROP COLUMN "district",
DROP COLUMN "province",
DROP COLUMN "subdistrict",
ADD COLUMN     "city_id" INTEGER NOT NULL,
ADD COLUMN     "district_id" INTEGER NOT NULL,
ADD COLUMN     "province_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."subdistricts";

-- AddForeignKey
ALTER TABLE "public"."user_addresses" ADD CONSTRAINT "user_addresses_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_addresses" ADD CONSTRAINT "user_addresses_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_addresses" ADD CONSTRAINT "user_addresses_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stores" ADD CONSTRAINT "stores_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stores" ADD CONSTRAINT "stores_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stores" ADD CONSTRAINT "stores_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
