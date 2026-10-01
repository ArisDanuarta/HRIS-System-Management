-- CreateEnum
CREATE TYPE "hris"."TimesheetStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REVISION_REQUESTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "hris"."ReviewerStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "hris"."timesheet_submissions" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period_month" INTEGER NOT NULL,
    "period_year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "spreadsheet_url" TEXT NOT NULL,
    "total_hours" DECIMAL(8,2) NOT NULL,
    "description" TEXT,
    "status" "hris"."TimesheetStatus" NOT NULL DEFAULT 'PENDING',
    "submitted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMPTZ(6),
    "payroll_period_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "timesheet_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hris"."timesheet_reviewers" (
    "id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "status" "hris"."ReviewerStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "reviewed_at" TIMESTAMPTZ(6),
    "action_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "timesheet_reviewers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "timesheet_submissions_employee_id_period_year_period_month_idx" ON "hris"."timesheet_submissions"("employee_id", "period_year", "period_month");

-- CreateIndex
CREATE INDEX "timesheet_submissions_status_idx" ON "hris"."timesheet_submissions"("status");

-- CreateIndex
CREATE INDEX "timesheet_reviewers_reviewer_id_status_idx" ON "hris"."timesheet_reviewers"("reviewer_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "timesheet_reviewers_submission_id_reviewer_id_key" ON "hris"."timesheet_reviewers"("submission_id", "reviewer_id");

-- AddForeignKey
ALTER TABLE "hris"."timesheet_submissions" ADD CONSTRAINT "timesheet_submissions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hris"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hris"."timesheet_submissions" ADD CONSTRAINT "timesheet_submissions_payroll_period_id_fkey" FOREIGN KEY ("payroll_period_id") REFERENCES "hris"."payroll_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hris"."timesheet_reviewers" ADD CONSTRAINT "timesheet_reviewers_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "hris"."timesheet_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hris"."timesheet_reviewers" ADD CONSTRAINT "timesheet_reviewers_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "hris"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
