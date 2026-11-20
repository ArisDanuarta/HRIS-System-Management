-- AlterTable email_broadcasts
ALTER TABLE "hris"."email_broadcasts"
  ADD COLUMN "category" VARCHAR(50),
  ADD COLUMN "priority" VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "require_read_receipt" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex for email_broadcasts.category
CREATE INDEX "email_broadcasts_category_idx" ON "hris"."email_broadcasts"("category");

-- AlterTable email_broadcast_recipients
ALTER TABLE "hris"."email_broadcast_recipients"
  ADD COLUMN "read_at" TIMESTAMPTZ(6);

-- CreateIndex for email_broadcast_recipients(broadcast_id, read_at)
CREATE INDEX "email_broadcast_recipients_broadcast_id_read_at_idx" ON "hris"."email_broadcast_recipients"("broadcast_id", "read_at");

-- AlterTable broadcast_drafts
ALTER TABLE "hris"."broadcast_drafts"
  ADD COLUMN "category" VARCHAR(50),
  ADD COLUMN "priority" VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN "require_read_receipt" BOOLEAN NOT NULL DEFAULT false;
