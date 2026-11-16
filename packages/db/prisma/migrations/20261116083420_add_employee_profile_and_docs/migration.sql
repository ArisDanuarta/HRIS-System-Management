-- CreateEnum
CREATE TYPE "hris"."Religion" AS ENUM ('ISLAM', 'CHRISTIAN', 'CATHOLIC', 'HINDU', 'BUDDHIST', 'CONFUCIAN', 'OTHER');

-- CreateEnum
CREATE TYPE "hris"."Citizenship" AS ENUM ('WNI', 'WNA');

-- CreateEnum
CREATE TYPE "hris"."BloodType" AS ENUM ('A', 'B', 'AB', 'O', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "hris"."AddressType" AS ENUM ('KTP', 'DOMICILE');

-- CreateEnum
CREATE TYPE "hris"."FamilyRelation" AS ENUM ('FATHER', 'MOTHER', 'SPOUSE', 'CHILD', 'SIBLING', 'OTHER');

-- CreateEnum
CREATE TYPE "hris"."EducationLevel" AS ENUM ('SMA_SMK', 'D3', 'D4', 'S1', 'S2', 'S3', 'OTHER');

-- AlterTable
ALTER TABLE "hris"."employee_documents" ADD COLUMN     "education_id" TEXT,
ADD COLUMN     "training_id" TEXT;

-- AlterTable
ALTER TABLE "hris"."employees" ADD COLUMN     "blood_type" "hris"."BloodType",
ADD COLUMN     "bpjs_kes_no_enc" TEXT,
ADD COLUMN     "bpjs_tk_no_enc" TEXT,
ADD COLUMN     "citizenship" "hris"."Citizenship" NOT NULL DEFAULT 'WNI',
ADD COLUMN     "emergency_contact_relation" TEXT,
ADD COLUMN     "landline_phone" TEXT,
ADD COLUMN     "legal_entity_id" TEXT,
ADD COLUMN     "mother_name" TEXT,
ADD COLUMN     "passport_kitas_enc" TEXT,
ADD COLUMN     "probation_end_date" DATE,
ADD COLUMN     "religion" "hris"."Religion",
ADD COLUMN     "work_location_id" TEXT;

-- AlterTable
ALTER TABLE "hris"."employment_contracts" ADD COLUMN     "contract_no" TEXT;

-- CreateTable
CREATE TABLE "hris"."work_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "work_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hris"."legal_entities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tku_code" TEXT,
    "npwp" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "legal_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hris"."employee_addresses" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "type" "hris"."AddressType" NOT NULL,
    "street" TEXT NOT NULL,
    "kelurahan" TEXT,
    "kecamatan" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postal_code" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employee_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hris"."employee_family_members" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relation" "hris"."FamilyRelation" NOT NULL,
    "birth_date" DATE,
    "phone" TEXT,
    "is_dependent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employee_family_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hris"."employee_educations" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "level" "hris"."EducationLevel" NOT NULL,
    "institution" TEXT NOT NULL,
    "major" TEXT,
    "graduation_year" INTEGER,
    "gpa" DECIMAL(4,2),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employee_educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hris"."employee_trainings" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "participation_type" TEXT,
    "start_date" DATE,
    "end_date" DATE,
    "duration" TEXT,
    "location" TEXT,
    "organizer" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employee_trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hris"."employee_work_experiences" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "reason_for_leaving" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employee_work_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_addresses_employee_id_type_key" ON "hris"."employee_addresses"("employee_id", "type");

-- CreateIndex
CREATE INDEX "employee_family_members_employee_id_idx" ON "hris"."employee_family_members"("employee_id");

-- CreateIndex
CREATE INDEX "employee_educations_employee_id_idx" ON "hris"."employee_educations"("employee_id");

-- CreateIndex
CREATE INDEX "employee_trainings_employee_id_idx" ON "hris"."employee_trainings"("employee_id");

-- CreateIndex
CREATE INDEX "employee_work_experiences_employee_id_idx" ON "hris"."employee_work_experiences"("employee_id");

-- CreateIndex
CREATE INDEX "employee_documents_education_id_idx" ON "hris"."employee_documents"("education_id");

-- CreateIndex
CREATE INDEX "employee_documents_training_id_idx" ON "hris"."employee_documents"("training_id");

-- CreateIndex
CREATE INDEX "employees_work_location_id_idx" ON "hris"."employees"("work_location_id");

-- CreateIndex
CREATE INDEX "employees_legal_entity_id_idx" ON "hris"."employees"("legal_entity_id");

-- AddForeignKey
ALTER TABLE "hris"."employees" ADD CONSTRAINT "employees_work_location_id_fkey" FOREIGN KEY ("work_location_id") REFERENCES "hris"."work_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hris"."employees" ADD CONSTRAINT "employees_legal_entity_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "hris"."legal_entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hris"."employee_documents" ADD CONSTRAINT "employee_documents_education_id_fkey" FOREIGN KEY ("education_id") REFERENCES "hris"."employee_educations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hris"."employee_documents" ADD CONSTRAINT "employee_documents_training_id_fkey" FOREIGN KEY ("training_id") REFERENCES "hris"."employee_trainings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hris"."employee_addresses" ADD CONSTRAINT "employee_addresses_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hris"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hris"."employee_family_members" ADD CONSTRAINT "employee_family_members_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hris"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hris"."employee_educations" ADD CONSTRAINT "employee_educations_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hris"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hris"."employee_trainings" ADD CONSTRAINT "employee_trainings_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hris"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hris"."employee_work_experiences" ADD CONSTRAINT "employee_work_experiences_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "hris"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill data awal & migrasi data existing
-- 1. Pindahkan alamat lama ke tabel baru sebagai alamat domisili
INSERT INTO "hris"."employee_addresses" ("id", "employee_id", "type", "street", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'DOMICILE', "address", now(), now()
FROM "hris"."employees"
WHERE "address" IS NOT NULL AND btrim("address") <> ''
ON CONFLICT ("employee_id", "type") DO NOTHING;

-- 2. Data master awal lokasi kerja & entitas hukum
INSERT INTO "hris"."work_locations" ("id", "name", "is_default", "is_active", "created_at", "updated_at")
VALUES (gen_random_uuid(), 'Pusat Studi Pendidikan dan Kebijakan Indonesia (PSPK)', true, true, now(), now());

INSERT INTO "hris"."legal_entities" ("id", "name", "tku_code", "is_default", "is_active", "created_at", "updated_at")
VALUES (gen_random_uuid(), 'YAYASAN PUSAT STUDI PENDIDIKAN DAN KEBIJAKAN INDONESIA', NULL, true, true, now(), now());

-- 3. Pasang default lokasi kerja & entitas hukum untuk pegawai yang sudah ada
UPDATE "hris"."employees"
SET "work_location_id" = (SELECT "id" FROM "hris"."work_locations" WHERE "is_default" = true LIMIT 1),
    "legal_entity_id"  = (SELECT "id" FROM "hris"."legal_entities"  WHERE "is_default" = true LIMIT 1)
WHERE "work_location_id" IS NULL;

