import { z } from "zod";

export const assetCategorySchema = z.enum(["IT", "NON_IT"]);
export const assetStatusSchema = z.enum([
  "IN_STOCK",
  "ASSIGNED",
  "MAINTENANCE",
  "RETIRED",
  "LOST",
]);

export const createAssetSchema = z.object({
  category: assetCategorySchema.default("IT"),
  type: z.string().min(1, "Tipe/jenis aset wajib diisi (mis. Laptop, Monitor, Meja, dll.)"),
  name: z.string().min(2, "Nama aset minimal 2 karakter"),
  brand: z.string().optional().nullable(),
  model: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  assetTag: z.string().min(2, "Tag aset unik wajib diisi"),
  purchaseDate: z.string().optional().nullable(),
  purchasePrice: z.number().min(0, "Harga pembelian tidak boleh negatif").optional().nullable(),
  status: assetStatusSchema.default("IN_STOCK"),
  location: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateAssetSchema = createAssetSchema.extend({
  id: z.string().min(1, "ID aset wajib diisi"),
});

export const deleteAssetSchema = z.object({
  id: z.string().min(1, "ID aset wajib diisi"),
});

export const checkoutAssetSchema = z.object({
  assetId: z.string().min(1, "ID aset wajib diisi"),
  employeeId: z.string().min(1, "Pegawai penerima wajib dipilih"),
  assignedAt: z.string().optional().nullable(),
  conditionOut: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const checkinAssetSchema = z.object({
  assignmentId: z.string().min(1, "ID penugasan wajib diisi"),
  assetId: z.string().min(1, "ID aset wajib diisi"),
  returnedAt: z.string().optional().nullable(),
  conditionIn: z.string().optional().nullable(),
  nextStatus: z.enum(["IN_STOCK", "MAINTENANCE", "RETIRED"]).default("IN_STOCK"),
  notes: z.string().optional().nullable(),
});

export type CreateAssetInput = z.input<typeof createAssetSchema>;
export type UpdateAssetInput = z.input<typeof updateAssetSchema>;
export type DeleteAssetInput = z.input<typeof deleteAssetSchema>;
export type CheckoutAssetInput = z.input<typeof checkoutAssetSchema>;
export type CheckinAssetInput = z.input<typeof checkinAssetSchema>;
