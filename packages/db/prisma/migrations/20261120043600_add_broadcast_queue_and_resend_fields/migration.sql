-- AlterTable
ALTER TABLE "hris"."email_broadcast_recipients" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_attempt_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "hris"."email_broadcasts" ADD COLUMN     "finished_at" TIMESTAMPTZ(6),
ADD COLUMN     "in_app_dispatched_at" TIMESTAMPTZ(6),
ADD COLUMN     "locked_at" TIMESTAMPTZ(6),
ADD COLUMN     "reply_to_mode" TEXT,
ADD COLUMN     "sender_display_title" TEXT,
ADD COLUMN     "sender_persona" TEXT,
ADD COLUMN     "started_at" TIMESTAMPTZ(6),
ALTER COLUMN "status" SET DEFAULT 'QUEUED';

-- CreateIndex
CREATE INDEX "email_broadcast_recipients_status_idx" ON "hris"."email_broadcast_recipients"("status");

-- CreateIndex
CREATE INDEX "email_broadcasts_status_idx" ON "hris"."email_broadcasts"("status");
