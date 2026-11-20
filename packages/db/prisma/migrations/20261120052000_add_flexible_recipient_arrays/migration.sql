-- AlterTable
ALTER TABLE "hris"."email_broadcasts"
ADD COLUMN "target_department_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "custom_employee_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "excluded_employee_ids" TEXT[] DEFAULT ARRAY[]::TEXT[];
