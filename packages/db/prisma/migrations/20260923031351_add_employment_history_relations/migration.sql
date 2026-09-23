-- AlterTable
ALTER TABLE "hris"."employment_histories" ADD COLUMN     "document_key" TEXT;

-- CreateIndex
CREATE INDEX "employment_histories_employee_id_idx" ON "hris"."employment_histories"("employee_id");

-- CreateIndex
CREATE INDEX "employment_histories_position_id_idx" ON "hris"."employment_histories"("position_id");

-- CreateIndex
CREATE INDEX "employment_histories_department_id_idx" ON "hris"."employment_histories"("department_id");

-- AddForeignKey
ALTER TABLE "hris"."employment_histories" ADD CONSTRAINT "employment_histories_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "hris"."positions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hris"."employment_histories" ADD CONSTRAINT "employment_histories_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "hris"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
