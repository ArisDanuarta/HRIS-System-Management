-- CreateEnum
CREATE TYPE "hris"."CalendarEventType" AS ENUM ('MEETING', 'LEAVE', 'HOLIDAY');

-- CreateEnum
CREATE TYPE "hris"."CalendarEventSource" AS ENUM ('GOOGLE_CALENDAR', 'HRIS_SYSTEM');

-- CreateTable
CREATE TABLE "hris"."calendar_events" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT,
    "external_id" TEXT,
    "type" "hris"."CalendarEventType" NOT NULL DEFAULT 'MEETING',
    "source" "hris"."CalendarEventSource" NOT NULL DEFAULT 'HRIS_SYSTEM',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start_at" TIMESTAMPTZ(6) NOT NULL,
    "end_at" TIMESTAMPTZ(6) NOT NULL,
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "meet_url" TEXT,
    "calendar_id" TEXT,
    "last_sync_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendar_events_start_at_end_at_idx" ON "hris"."calendar_events"("start_at", "end_at");

-- CreateIndex
CREATE INDEX "calendar_events_employee_id_type_idx" ON "hris"."calendar_events"("employee_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_events_employee_id_external_id_key" ON "hris"."calendar_events"("employee_id", "external_id");

-- AddForeignKey
ALTER TABLE "hris"."calendar_events" ADD CONSTRAINT "calendar_events_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hris"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
