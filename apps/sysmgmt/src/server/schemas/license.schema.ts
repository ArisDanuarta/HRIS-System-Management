import { z } from "zod";

export const createLicenseSchema = z.object({
  name: z.string().trim().min(2, "Nama lisensi / software wajib diisi, minimal 2 karakter"),
  vendor: z.string().trim().optional().nullable(),
  licenseKey: z.string().trim().optional().nullable(),
  seatsTotal: z.coerce.number().int().min(1, "Total kursi lisensi minimal 1").default(1),
  seatsUsed: z.coerce.number().int().min(0, "Kursi terpakai minimal 0").default(0),
  purchaseDate: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const updateLicenseSchema = createLicenseSchema.extend({
  id: z.string().min(1, "ID lisensi wajib diisi"),
  clearLicenseKey: z.boolean().optional(),
});

export const revealLicenseKeySchema = z.object({
  id: z.string().min(1, "ID lisensi wajib diisi"),
  reason: z.string().trim().optional().nullable(),
});

export const deleteLicenseSchema = z.object({
  id: z.string().min(1, "ID lisensi wajib diisi"),
});

export type CreateLicenseInput = z.input<typeof createLicenseSchema>;
export type UpdateLicenseInput = z.input<typeof updateLicenseSchema>;
export type RevealLicenseKeyInput = z.input<typeof revealLicenseKeySchema>;
export type DeleteLicenseInput = z.input<typeof deleteLicenseSchema>;
