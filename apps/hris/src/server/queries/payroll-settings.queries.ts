import { prisma } from "@pspk/db";
import { decryptField } from "@pspk/shared";

export interface PayrollSettingsData {
  id: string;
  institutionName: string;
  subHeader: string;
  addressLine: string | null;
  logoKey: string | null;
  logoUrl: string | null;
  headerBannerKey: string | null;
  headerBannerUrl: string | null;
  borderStyle: "NAVY_SOLID" | "NAVY_GOLD" | "DOUBLE_LINE" | "MINIMALIST" | string;
  disclaimerText: string;
  senderBankName: string;
  senderAccountMasked: string;
  senderAccountRaw: string;
  senderAccountName: string;
  senderBranch: string | null;
  payrollTransferNote: string;
  authorizedSignerName: string | null;
  authorizedSignerTitle: string | null;
  signatureKey: string | null;
  signatureUrl: string | null;
  stampKey: string | null;
  stampUrl: string | null;
  isDefault: boolean;
  updatedAt: string;
}

export type PayrollSettingRecord = {
  id: string;
  institutionName: string;
  subHeader: string;
  addressLine: string | null;
  logoKey: string | null;
  headerBannerKey: string | null;
  borderStyle: string;
  disclaimerText: string;
  senderBankName: string;
  senderBankAccountEnc: string | null;
  senderAccountName: string;
  senderBranch: string | null;
  payrollTransferNote: string;
  authorizedSignerName: string | null;
  authorizedSignerTitle: string | null;
  signatureKey: string | null;
  stampKey: string | null;
  isDefault: boolean;
  updatedByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DbWithPayrollSetting = {
  payrollSetting: {
    findFirst: (args?: { where?: { isDefault?: boolean } }) => Promise<PayrollSettingRecord | null>;
    upsert: (args: {
      where: { id: string };
      update: Partial<PayrollSettingRecord>;
      create: Partial<PayrollSettingRecord>;
    }) => Promise<PayrollSettingRecord>;
    update: (args: {
      where: { id: string };
      data: Partial<PayrollSettingRecord>;
    }) => Promise<PayrollSettingRecord>;
    create: (args: { data: Partial<PayrollSettingRecord> }) => Promise<PayrollSettingRecord>;
  };
};

export const getPayrollDb = (): DbWithPayrollSetting =>
  prisma as unknown as DbWithPayrollSetting;

/**
 * Mengambil pengaturan penggajian & dokumen resmi aktif
 */
export async function getPayrollSettings(): Promise<PayrollSettingsData> {
  const db = getPayrollDb();
  let setting = await db.payrollSetting.findFirst({
    where: { isDefault: true },
  });

  // Jika belum ada di database, buat pengaturan default secara otomatis
  if (!setting) {
    setting = await db.payrollSetting.create({
      data: {
        institutionName: "Pusat Studi Pendidikan & Kebijakan",
        subHeader: "HR & Finance Division • Sistem Penggajian Elektronik",
        addressLine: "Gedung Edukasi Lt. 3, Jl. Kebijakan No. 45, Jakarta Selatan",
        borderStyle: "NAVY_SOLID",
        disclaimerText:
          "Dokumen ini diterbitkan secara elektronik oleh Divisi SDM & Keuangan Pusat Studi Pendidikan dan Kebijakan (PSPK). Sah tanpa tanda tangan basah.",
        senderBankName: "Bank Central Asia (BCA)",
        senderAccountName: "Pusat Studi Pendidikan dan Kebijakan",
        senderBranch: "KCU Jakarta Rasuna Said",
        payrollTransferNote: "Payroll Gaji Pegawai PSPK",
        authorizedSignerName: "Dewi Permata, S.Psi.",
        authorizedSignerTitle: "Staf Administrasi & HR Lead",
        isDefault: true,
      },
    });
  }

  // Dekripsi nomor rekening untuk keperluan administrasi HR
  let senderAccountRaw = "";
  let senderAccountMasked = "-";

  if (setting.senderBankAccountEnc) {
    try {
      senderAccountRaw = decryptField(setting.senderBankAccountEnc);
      if (senderAccountRaw.length > 4) {
        senderAccountMasked = `•••• ${senderAccountRaw.slice(-4)}`;
      } else {
        senderAccountMasked = senderAccountRaw;
      }
    } catch {
      senderAccountMasked = "[Tersimpan Terenkripsi]";
      senderAccountRaw = "";
    }
  }

  const logoUrl = setting.logoKey ? `/api/documents/${setting.logoKey}` : null;
  const headerBannerUrl = setting.headerBannerKey
    ? `/api/documents/${setting.headerBannerKey}`
    : null;
  const signatureUrl = setting.signatureKey
    ? `/api/documents/${setting.signatureKey}`
    : null;
  const stampUrl = setting.stampKey
    ? `/api/documents/${setting.stampKey}`
    : null;

  return {
    id: setting.id,
    institutionName: setting.institutionName,
    subHeader: setting.subHeader,
    addressLine: setting.addressLine,
    logoKey: setting.logoKey,
    logoUrl,
    headerBannerKey: setting.headerBannerKey,
    headerBannerUrl,
    borderStyle: setting.borderStyle,
    disclaimerText: setting.disclaimerText,
    senderBankName: setting.senderBankName,
    senderAccountMasked,
    senderAccountRaw,
    senderAccountName: setting.senderAccountName,
    senderBranch: setting.senderBranch,
    payrollTransferNote: setting.payrollTransferNote,
    authorizedSignerName: setting.authorizedSignerName,
    authorizedSignerTitle: setting.authorizedSignerTitle,
    signatureKey: setting.signatureKey,
    signatureUrl,
    stampKey: setting.stampKey,
    stampUrl,
    isDefault: setting.isDefault,
    updatedAt: setting.updatedAt.toISOString(),
  };
}
