-- CreateEnum
CREATE TYPE "hris"."WageType" AS ENUM ('MONTHLY', 'HOURLY');

-- AlterTable
ALTER TABLE "hris"."employment_contracts" ADD COLUMN     "hourly_rate" DECIMAL(15,2),
ADD COLUMN     "wage_type" "hris"."WageType" NOT NULL DEFAULT 'MONTHLY';

-- AlterTable
ALTER TABLE "hris"."payslips" ADD COLUMN     "hourly_rate" DECIMAL(15,2),
ADD COLUMN     "timesheet_key" TEXT,
ADD COLUMN     "total_hours" DECIMAL(8,2),
ADD COLUMN     "wage_type" "hris"."WageType" NOT NULL DEFAULT 'MONTHLY';
