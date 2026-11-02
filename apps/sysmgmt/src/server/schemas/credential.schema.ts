import { z } from "zod";

export const credentialCategories = [
  "SOCIAL_MEDIA",
  "WEBSITE_HOSTING",
  "SAAS_TOOL",
  "EMAIL_SERVICE",
  "GOVERNMENT_PUBLIC",
  "FINANCE_BANKING",
  "OTHER",
] as const;

export const twoFactorTypes = [
  "NONE",
  "AUTHENTICATOR_APP",
  "SMS_OTP",
  "EMAIL_OTP",
  "HARDWARE_KEY",
  "OTHER",
] as const;

function normalizeUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export const createCredentialSchema = z
  .object({
    title: z.string().trim().min(2, "Nama akun / layanan wajib diisi, minimal 2 karakter"),
    category: z
      .enum(credentialCategories, {
        errorMap: () => ({ message: "Pilih kategori layanan yang valid" }),
      })
      .default("OTHER"),
    url: z.string().trim().optional().nullable().transform(normalizeUrl),
    username: z.string().trim().optional().nullable(),
    email: z.string().trim().optional().nullable(),
    password: z.string().min(1, "Password akun wajib diisi"),
    twoFactorType: z.enum(twoFactorTypes).default("NONE"),
    recoveryEmail: z.string().trim().optional().nullable(),
    recoveryPhone: z.string().trim().optional().nullable(),
    picEmployeeId: z.string().trim().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.username || data.email, {
    message: "Salah satu dari Username atau Email wajib diisi",
    path: ["username"],
  });

export const updateCredentialSchema = z
  .object({
    id: z.string().min(1, "ID kredensial wajib diisi"),
    title: z.string().trim().min(2, "Nama akun / layanan wajib diisi, minimal 2 karakter"),
    category: z
      .enum(credentialCategories, {
        errorMap: () => ({ message: "Pilih kategori layanan yang valid" }),
      })
      .default("OTHER"),
    url: z.string().trim().optional().nullable().transform(normalizeUrl),
    username: z.string().trim().optional().nullable(),
    email: z.string().trim().optional().nullable(),
    password: z.string().optional().nullable(),
    twoFactorType: z.enum(twoFactorTypes).default("NONE"),
    recoveryEmail: z.string().trim().optional().nullable(),
    recoveryPhone: z.string().trim().optional().nullable(),
    picEmployeeId: z.string().trim().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.username || data.email, {
    message: "Salah satu dari Username atau Email wajib diisi",
    path: ["username"],
  });

export const revealCredentialPasswordSchema = z.object({
  id: z.string().min(1, "ID kredensial wajib diisi"),
  reason: z.string().trim().optional(),
});

export const deleteCredentialSchema = z.object({
  id: z.string().min(1, "ID kredensial wajib diisi"),
});

export type CreateCredentialInput = z.input<typeof createCredentialSchema>;
export type UpdateCredentialInput = z.input<typeof updateCredentialSchema>;
export type RevealCredentialPasswordInput = z.input<typeof revealCredentialPasswordSchema>;
export type DeleteCredentialInput = z.input<typeof deleteCredentialSchema>;
