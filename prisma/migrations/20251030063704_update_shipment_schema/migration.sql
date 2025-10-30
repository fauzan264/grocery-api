/*
  Warnings:

  - You are about to drop the column `cityName` on the `shipments` table. All the data in the column will be lost.
  - You are about to drop the column `districtName` on the `shipments` table. All the data in the column will be lost.
  - You are about to drop the column `provinceName` on the `shipments` table. All the data in the column will be lost.
  - Added the required column `city_name` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `district_name` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province_name` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Made the column `address` on table `shipments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."shipments" DROP COLUMN "cityName",
DROP COLUMN "districtName",
DROP COLUMN "provinceName",
ADD COLUMN     "city_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "district_name" VARCHAR(100) NOT NULL,
ADD COLUMN     "province_name" VARCHAR(100) NOT NULL,
ALTER COLUMN "address" SET NOT NULL;
