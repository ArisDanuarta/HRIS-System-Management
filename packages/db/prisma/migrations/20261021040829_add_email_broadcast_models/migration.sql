-- CreateEnum
CREATE TYPE "hris"."BroadcastScope" AS ENUM ('ALL_EMPLOYEES', 'DEPARTMENT', 'TEAM', 'CUSTOM');

-- CreateEnum
CREATE TYPE "hris"."BroadcastStatus" AS ENUM ('DRAFT', 'SENDING', 'SENT', 'PARTIALLY_FAILED', 'FAILED');

-- CreateEnum
CREATE TYPE "hris"."BroadcastDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "hris"."email_broadcasts" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content_html" TEXT NOT NULL,
    "content_text" TEXT NOT NULL,
    "sender_user_id" TEXT NOT NULL,
    "sender_employee_id" TEXT,
    "sender_name" TEXT NOT NULL,
    "sender_email" TEXT NOT NULL,
    "reply_to_email" TEXT NOT NULL,
    "target_scope" "hris"."BroadcastScope" NOT NULL DEFAULT 'TEAM',
    "target_department_id" TEXT,
    "total_recipients" INTEGER NOT NULL DEFAULT 0,
    "sent_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "send_in_app" BOOLEAN NOT NULL DEFAULT true,
    "status" "hris"."BroadcastStatus" NOT NULL DEFAULT 'SENT',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_broadcasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hris"."email_broadcast_recipients" (
    "id" TEXT NOT NULL,
    "broadcast_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "email" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "status" "hris"."BroadcastDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "sent_at" TIMESTAMPTZ(6),

    CONSTRAINT "email_broadcast_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_broadcasts_sender_user_id_idx" ON "hris"."email_broadcasts"("sender_user_id");

-- CreateIndex
CREATE INDEX "email_broadcasts_created_at_idx" ON "hris"."email_broadcasts"("created_at" DESC);

-- CreateIndex
CREATE INDEX "email_broadcast_recipients_broadcast_id_idx" ON "hris"."email_broadcast_recipients"("broadcast_id");

-- CreateIndex
CREATE INDEX "email_broadcast_recipients_email_idx" ON "hris"."email_broadcast_recipients"("email");

-- AddForeignKey
ALTER TABLE "hris"."email_broadcasts" ADD CONSTRAINT "email_broadcasts_sender_employee_id_fkey" FOREIGN KEY ("sender_employee_id") REFERENCES "hris"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hris"."email_broadcasts" ADD CONSTRAINT "email_broadcasts_target_department_id_fkey" FOREIGN KEY ("target_department_id") REFERENCES "hris"."departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hris"."email_broadcast_recipients" ADD CONSTRAINT "email_broadcast_recipients_broadcast_id_fkey" FOREIGN KEY ("broadcast_id") REFERENCES "hris"."email_broadcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hris"."email_broadcast_recipients" ADD CONSTRAINT "email_broadcast_recipients_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hris"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
