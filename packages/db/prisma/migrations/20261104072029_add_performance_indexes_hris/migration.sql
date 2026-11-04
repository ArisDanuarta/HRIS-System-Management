-- CreateIndex
CREATE INDEX "employee_salary_components_employee_id_idx" ON "hris"."employee_salary_components"("employee_id");

-- CreateIndex
CREATE INDEX "leave_requests_status_idx" ON "hris"."leave_requests"("status");

-- CreateIndex
CREATE INDEX "payslip_lines_payslip_id_idx" ON "hris"."payslip_lines"("payslip_id");

-- CreateIndex
CREATE INDEX "payslips_employee_id_status_idx" ON "hris"."payslips"("employee_id", "status");
