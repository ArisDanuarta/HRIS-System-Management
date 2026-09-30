-- CreateTable
CREATE TABLE "hris"."payroll_settings" (
    "id" TEXT NOT NULL,
    "institution_name" TEXT NOT NULL DEFAULT 'Pusat Studi Pendidikan dan Kebijakan',
    "sub_header" TEXT NOT NULL DEFAULT 'HR & Finance Division • Sistem Penggajian Elektronik',
    "address_line" TEXT,
    "logo_key" TEXT,
    "header_banner_key" TEXT,
    "border_style" TEXT NOT NULL DEFAULT 'NAVY_SOLID',
    "disclaimer_text" TEXT NOT NULL DEFAULT 'Dokumen ini diterbitkan secara elektronik oleh Divisi SDM & Keuangan Pusat Studi Pendidikan dan Kebijakan (PSPK). Sah tanpa tanda tangan basah.',
    "sender_bank_name" TEXT NOT NULL DEFAULT 'Bank Central Asia (BCA)',
    "sender_bank_account_enc" TEXT,
    "sender_account_name" TEXT NOT NULL DEFAULT 'Pusat Studi Pendidikan dan Kebijakan',
    "sender_branch" TEXT,
    "payroll_transfer_note" TEXT NOT NULL DEFAULT 'Payroll Gaji PSPK',
    "authorized_signer_name" TEXT,
    "authorized_signer_title" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT true,
    "updated_by_user_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "payroll_settings_pkey" PRIMARY KEY ("id")
);
