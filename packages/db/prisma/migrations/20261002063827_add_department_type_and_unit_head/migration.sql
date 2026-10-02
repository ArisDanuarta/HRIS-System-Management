-- CreateEnum
CREATE TYPE "hris"."DepartmentType" AS ENUM ('GOVERNANCE', 'LEADERSHIP', 'INITIATIVE', 'SUPPORT');

-- AlterTable
ALTER TABLE "hris"."departments" ADD COLUMN     "type" "hris"."DepartmentType" NOT NULL DEFAULT 'INITIATIVE';

-- AlterTable
ALTER TABLE "hris"."positions" ADD COLUMN     "is_unit_head" BOOLEAN NOT NULL DEFAULT false;
