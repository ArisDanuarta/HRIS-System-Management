-- CreateTable
CREATE TABLE "hris"."email_broadcast_attachments" (
    "id" TEXT NOT NULL,
    "broadcast_id" TEXT,
    "draft_id" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_broadcast_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_broadcast_attachments_broadcast_id_idx" ON "hris"."email_broadcast_attachments"("broadcast_id");

-- CreateIndex
CREATE INDEX "email_broadcast_attachments_draft_id_idx" ON "hris"."email_broadcast_attachments"("draft_id");

-- CreateIndex
CREATE INDEX "email_broadcast_attachments_uploaded_by_idx" ON "hris"."email_broadcast_attachments"("uploaded_by");

-- AddForeignKey
ALTER TABLE "hris"."email_broadcast_attachments" ADD CONSTRAINT "email_broadcast_attachments_broadcast_id_fkey" FOREIGN KEY ("broadcast_id") REFERENCES "hris"."email_broadcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hris"."email_broadcast_attachments" ADD CONSTRAINT "email_broadcast_attachments_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "hris"."broadcast_drafts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
