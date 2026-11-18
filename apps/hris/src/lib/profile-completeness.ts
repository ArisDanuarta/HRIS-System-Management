/**
 * Helper untuk menghitung persentase dan daftar kelengkapan profil karyawan (360° Profile Completeness).
 * Memeriksa 12 komponen vital yang diinputkan melalui wizard pendaftaran pegawai.
 */

export interface CompletenessItem {
  key: string;
  label: string;
  category: "IDENTITAS" | "KELUARGA_PENDIDIKAN" | "DOKUMEN" | "PAYROLL";
  isComplete: boolean;
  description: string;
}

export interface ProfileCompletenessResult {
  percentage: number;
  completedCount: number;
  totalCount: number;
  items: CompletenessItem[];
  missingItems: CompletenessItem[];
}

export function calculateProfileCompleteness(employee: {
  photoKey?: string | null;
  address?: string | null;
  addresses?: Array<{ type: string; street?: string | null }>;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  familyMembers?: Array<unknown>;
  educations?: Array<unknown>;
  workExperiences?: Array<unknown>;
  documents?: Array<{ category: string }>;
  hasKtp?: boolean;
  hasNpwp?: boolean;
  hasDiploma?: boolean;
  hasCv?: boolean;
  hasBankAccount?: boolean;
  bankAccountEnc?: string | null;
  bankAccountMasked?: string | null;
  bankName?: string | null;
}): ProfileCompletenessResult {
  const addresses = employee.addresses || [];
  const documents = employee.documents || [];

  const hasKtpAddress =
    addresses.some((a) => a.type === "KTP" && a.street && a.street.trim() !== "") ||
    Boolean(employee.address && employee.address.trim() !== "");

  const hasDomicileAddress =
    addresses.some((a) => a.type === "DOMICILE" && a.street && a.street.trim() !== "") ||
    Boolean(employee.address && employee.address.trim() !== "");

  const hasEmergencyContact = Boolean(
    employee.emergencyContactName?.trim() && employee.emergencyContactPhone?.trim(),
  );

  const hasFamily = Boolean(employee.familyMembers && employee.familyMembers.length > 0);
  const hasEducation = Boolean(employee.educations && employee.educations.length > 0);
  const hasExperience = Boolean(employee.workExperiences && employee.workExperiences.length > 0);

  const hasDocKtp =
    Boolean(employee.hasKtp) || documents.some((d) => d.category.toUpperCase() === "KTP");
  const hasDocNpwp =
    Boolean(employee.hasNpwp) || documents.some((d) => d.category.toUpperCase() === "NPWP");
  const hasDocDiploma =
    Boolean(employee.hasDiploma) || documents.some((d) => d.category.toUpperCase() === "DIPLOMA");
  const hasDocCv =
    Boolean(employee.hasCv) || documents.some((d) => d.category.toUpperCase() === "CV");

  const hasBank =
    Boolean(employee.hasBankAccount) ||
    Boolean(employee.bankAccountEnc) ||
    (Boolean(employee.bankAccountMasked) && employee.bankAccountMasked !== "-");

  const hasPhoto = Boolean(employee.photoKey && employee.photoKey.trim() !== "");

  const items: CompletenessItem[] = [
    {
      key: "photo",
      label: "Foto Profil Resmi",
      category: "IDENTITAS",
      isComplete: hasPhoto,
      description: "Pas foto formal pegawai untuk identifikasi ID Card & profil.",
    },
    {
      key: "ktpAddress",
      label: "Alamat Sesuai KTP",
      category: "IDENTITAS",
      isComplete: hasKtpAddress,
      description: "Alamat domisili hukum resmi sesuai kartu identitas kependudukan.",
    },
    {
      key: "domicileAddress",
      label: "Alamat Domisili Sekarang",
      category: "IDENTITAS",
      isComplete: hasDomicileAddress,
      description: "Alamat tempat tinggal aktif pegawai saat ini.",
    },
    {
      key: "emergencyContact",
      label: "Kontak Darurat (Nama & No. HP)",
      category: "IDENTITAS",
      isComplete: hasEmergencyContact,
      description: "Nomor darurat yang dapat dihubungi saat kondisi krisis/kesehatan.",
    },
    {
      key: "family",
      label: "Susunan Anggota Keluarga",
      category: "KELUARGA_PENDIDIKAN",
      isComplete: hasFamily,
      description: "Data pasangan, anak, atau orang tua untuk verifikasi tunjangan & BPJS.",
    },
    {
      key: "education",
      label: "Riwayat Pendidikan Terakhir",
      category: "KELUARGA_PENDIDIKAN",
      isComplete: hasEducation,
      description: "Catatan jenjang pendidikan formal (minimal jenjang tertinggi).",
    },
    {
      key: "experience",
      label: "Riwayat Pengalaman Kerja",
      category: "KELUARGA_PENDIDIKAN",
      isComplete: hasExperience,
      description: "Portofolio instansi/tempat kerja sebelumnya sebelum bergabung di PSPK.",
    },
    {
      key: "docKtp",
      label: "Unggahan Berkas KTP",
      category: "DOKUMEN",
      isComplete: hasDocKtp,
      description: "Scan dokumen asli Kartu Tanda Penduduk Republik Indonesia.",
    },
    {
      key: "docNpwp",
      label: "Unggahan Berkas NPWP",
      category: "DOKUMEN",
      isComplete: hasDocNpwp,
      description: "Scan kartu atau bukti elektronik Nomor Pokok Wajib Pajak.",
    },
    {
      key: "docDiploma",
      label: "Unggahan Berkas Ijazah",
      category: "DOKUMEN",
      isComplete: hasDocDiploma,
      description: "Scan ijazah atau sertifikat kelulusan pendidikan formal.",
    },
    {
      key: "docCv",
      label: "Unggahan Berkas CV / Resume",
      category: "DOKUMEN",
      isComplete: hasDocCv,
      description: "Curriculum Vitae terbaru saat proses rekrutmen pegawai.",
    },
    {
      key: "bankAccount",
      label: "Rekening Bank Payroll",
      category: "PAYROLL",
      isComplete: hasBank,
      description: "Informasi nama bank & nomor rekening untuk penyaluran gaji bulanan.",
    },
  ];

  const completedCount = items.filter((i) => i.isComplete).length;
  const totalCount = items.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const missingItems = items.filter((i) => !i.isComplete);

  return {
    percentage,
    completedCount,
    totalCount,
    items,
    missingItems,
  };
}
