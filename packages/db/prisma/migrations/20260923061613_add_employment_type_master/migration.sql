-- AlterTable
ALTER TABLE "hris"."employment_contracts" ADD COLUMN     "employment_type_id" TEXT;

-- CreateTable
CREATE TABLE "hris"."employment_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "hris"."EmploymentType" NOT NULL DEFAULT 'FIXED_TERM',
    "wage_type" "hris"."WageType" NOT NULL DEFAULT 'MONTHLY',
    "default_hourly_rate" DECIMAL(15,2),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "employment_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employment_types_code_key" ON "hris"."employment_types"("code");

-- CreateIndex
CREATE INDEX "employment_contracts_employment_type_id_idx" ON "hris"."employment_contracts"("employment_type_id");

-- AddForeignKey
ALTER TABLE "hris"."employment_contracts" ADD CONSTRAINT "employment_contracts_employment_type_id_fkey" FOREIGN KEY ("employment_type_id") REFERENCES "hris"."employment_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
