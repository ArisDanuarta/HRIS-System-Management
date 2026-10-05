-- CreateTable
CREATE TABLE "hris"."employee_documents" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_documents_employee_id_idx" ON "hris"."employee_documents"("employee_id");

-- CreateIndex
CREATE INDEX "employee_documents_category_idx" ON "hris"."employee_documents"("category");

-- AddForeignKey
ALTER TABLE "hris"."employee_documents" ADD CONSTRAINT "employee_documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hris"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
