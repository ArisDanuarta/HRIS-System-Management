-- CreateTable
CREATE TABLE "hris"."broadcast_drafts" (
    "id" TEXT NOT NULL,
    "owner_user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL DEFAULT '',
    "content_html" TEXT NOT NULL DEFAULT '',
    "target_scope" "hris"."BroadcastScope" NOT NULL DEFAULT 'TEAM',
    "target_department_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "custom_employee_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excluded_employee_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sender_persona" TEXT NOT NULL DEFAULT 'ORGANIZATION',
    "custom_sender_name" TEXT,
    "reply_to_mode" TEXT NOT NULL DEFAULT 'NO_REPLY',
    "custom_reply_to_email" TEXT,
    "send_in_app" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "broadcast_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hris"."broadcast_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "subject" TEXT NOT NULL,
    "content_html" TEXT NOT NULL,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "broadcast_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "broadcast_drafts_owner_user_id_updated_at_idx" ON "hris"."broadcast_drafts"("owner_user_id", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "broadcast_templates_is_shared_updated_at_idx" ON "hris"."broadcast_templates"("is_shared", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "broadcast_templates_created_by_user_id_idx" ON "hris"."broadcast_templates"("created_by_user_id");
