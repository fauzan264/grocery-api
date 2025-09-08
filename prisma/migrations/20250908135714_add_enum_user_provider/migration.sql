-- CreateEnum
CREATE TYPE "public"."user_providers" AS ENUM ('LOCAL', 'GOOGLE');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "userProvider" "public"."user_providers" NOT NULL DEFAULT 'LOCAL',
ALTER COLUMN "date_of_birth" DROP NOT NULL;
