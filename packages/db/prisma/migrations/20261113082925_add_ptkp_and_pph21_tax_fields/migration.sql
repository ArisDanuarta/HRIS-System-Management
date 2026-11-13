-- CreateEnum
CREATE TYPE "hris"."PtkpStatus" AS ENUM ('TK_0', 'TK_1', 'TK_2', 'TK_3', 'K_0', 'K_1', 'K_2', 'K_3');

-- CreateEnum
CREATE TYPE "hris"."TaxMethod" AS ENUM ('GROSS', 'GROSS_UP', 'NETT');

-- AlterTable
ALTER TABLE "hris"."employees" ADD COLUMN     "ptkp_status" "hris"."PtkpStatus" NOT NULL DEFAULT 'TK_0',
ADD COLUMN     "tax_method" "hris"."TaxMethod" NOT NULL DEFAULT 'GROSS';

-- AlterTable
ALTER TABLE "hris"."payslips" ADD COLUMN     "pph21_amount" DECIMAL(15,2),
ADD COLUMN     "taxable_gross" DECIMAL(15,2),
ADD COLUMN     "ter_category" TEXT,
ADD COLUMN     "ter_rate" DECIMAL(5,4);
