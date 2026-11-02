-- CreateEnum
CREATE TYPE "sysmgmt"."CredentialCategory" AS ENUM ('SOCIAL_MEDIA', 'WEBSITE_HOSTING', 'SAAS_TOOL', 'EMAIL_SERVICE', 'GOVERNMENT_PUBLIC', 'FINANCE_BANKING', 'OTHER');

-- CreateEnum
CREATE TYPE "sysmgmt"."TwoFactorType" AS ENUM ('NONE', 'AUTHENTICATOR_APP', 'SMS_OTP', 'EMAIL_OTP', 'HARDWARE_KEY', 'OTHER');

-- CreateTable
CREATE TABLE "sysmgmt"."credentials" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "sysmgmt"."CredentialCategory" NOT NULL DEFAULT 'OTHER',
    "url" TEXT,
    "username" TEXT,
    "email" TEXT,
    "password_enc" TEXT NOT NULL,
    "two_factor_type" "sysmgmt"."TwoFactorType" NOT NULL DEFAULT 'NONE',
    "recovery_email" TEXT,
    "recovery_phone" TEXT,
    "pic_employee_id" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_rotated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "credentials_category_idx" ON "sysmgmt"."credentials"("category");

-- CreateIndex
CREATE INDEX "credentials_is_active_idx" ON "sysmgmt"."credentials"("is_active");

-- CreateIndex
CREATE INDEX "credentials_pic_employee_id_idx" ON "sysmgmt"."credentials"("pic_employee_id");

-- AddForeignKey
ALTER TABLE "sysmgmt"."credentials" ADD CONSTRAINT "credentials_pic_employee_id_fkey" FOREIGN KEY ("pic_employee_id") REFERENCES "hris"."employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
