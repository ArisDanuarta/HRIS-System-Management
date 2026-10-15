-- DropForeignKey
ALTER TABLE "hris"."training_records" DROP CONSTRAINT IF EXISTS "training_records_employee_id_fkey";

-- DropTable
DROP TABLE IF EXISTS "hris"."training_records";

-- Clean up unused recruitment & training permissions
DELETE FROM "core"."permissions" WHERE "key" LIKE 'hris.recruitment.%' OR "key" LIKE 'hris.training.%';
