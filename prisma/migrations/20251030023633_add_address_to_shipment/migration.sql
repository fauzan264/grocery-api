-- AlterTable
ALTER TABLE "public"."shipments" ADD COLUMN     "address" VARCHAR(255),
ADD COLUMN     "cityName" VARCHAR(100),
ADD COLUMN     "districtName" VARCHAR(100),
ADD COLUMN     "provinceName" VARCHAR(100);
