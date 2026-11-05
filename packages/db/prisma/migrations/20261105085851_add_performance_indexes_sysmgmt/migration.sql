-- CreateIndex
CREATE INDEX "documents_status_visibility_idx" ON "sysmgmt"."documents"("status", "visibility");

-- CreateIndex
CREATE INDEX "documents_category_idx" ON "sysmgmt"."documents"("category");

-- CreateIndex
CREATE INDEX "software_licenses_expires_at_idx" ON "sysmgmt"."software_licenses"("expires_at");

-- CreateIndex
CREATE INDEX "software_licenses_vendor_idx" ON "sysmgmt"."software_licenses"("vendor");
