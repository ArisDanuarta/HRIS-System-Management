-- AlterTable
ALTER TABLE "hris"."employee_documents" ADD COLUMN     "work_experience_id" TEXT;

-- CreateIndex
CREATE INDEX "employee_documents_work_experience_id_idx" ON "hris"."employee_documents"("work_experience_id");

-- AddForeignKey
ALTER TABLE "hris"."employee_documents" ADD CONSTRAINT "employee_documents_work_experience_id_fkey" FOREIGN KEY ("work_experience_id") REFERENCES "hris"."employee_work_experiences"("id") ON DELETE SET NULL ON UPDATE CASCADE;
