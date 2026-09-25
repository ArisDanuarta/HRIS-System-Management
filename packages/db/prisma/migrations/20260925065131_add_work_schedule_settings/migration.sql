-- CreateTable
CREATE TABLE "hris"."work_schedule_settings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Jadwal Reguler PSPK',
    "work_start_time" TEXT NOT NULL DEFAULT '09:00',
    "work_end_time" TEXT NOT NULL DEFAULT '17:00',
    "grace_period_mins" INTEGER NOT NULL DEFAULT 15,
    "working_days" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "is_flexible" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "department_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "work_schedule_settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "hris"."work_schedule_settings" ADD CONSTRAINT "work_schedule_settings_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "hris"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
