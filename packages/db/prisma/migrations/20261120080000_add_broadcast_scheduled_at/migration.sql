-- AlterTable
ALTER TABLE "hris"."email_broadcasts" ADD COLUMN "scheduled_at" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "email_broadcasts_status_scheduled_at_idx" ON "hris"."email_broadcasts"("status", "scheduled_at");
