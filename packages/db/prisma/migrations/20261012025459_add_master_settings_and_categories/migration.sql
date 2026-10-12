-- AlterTable
ALTER TABLE "sysmgmt"."documents" ADD COLUMN     "category_id" TEXT;

-- CreateTable
CREATE TABLE "sysmgmt"."document_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code_prefix" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT 'blue',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "document_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sysmgmt"."asset_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "sysmgmt"."AssetCategory" NOT NULL DEFAULT 'IT',
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "asset_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sysmgmt"."asset_locations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "building" TEXT,
    "floor" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "asset_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_categories_name_key" ON "sysmgmt"."document_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "document_categories_code_prefix_key" ON "sysmgmt"."document_categories"("code_prefix");

-- CreateIndex
CREATE UNIQUE INDEX "asset_types_name_key" ON "sysmgmt"."asset_types"("name");

-- CreateIndex
CREATE INDEX "asset_types_category_idx" ON "sysmgmt"."asset_types"("category");

-- CreateIndex
CREATE UNIQUE INDEX "asset_locations_name_key" ON "sysmgmt"."asset_locations"("name");

-- CreateIndex
CREATE INDEX "documents_category_id_idx" ON "sysmgmt"."documents"("category_id");

-- AddForeignKey
ALTER TABLE "sysmgmt"."documents" ADD CONSTRAINT "documents_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "sysmgmt"."document_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
