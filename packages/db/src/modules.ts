import { PrismaClient } from "@prisma/client";

export interface SystemModuleDefinition {
  key: string; // Database key, e.g. "module.org_chart.enabled"
  moduleKey: string; // Short key, e.g. "org_chart"
  name: string;
  category: "hris" | "sysmgmt";
  description: string;
  defaultEnabled: boolean;
  affectedNavItems: string[];
  affectedRoutes: string[];
  impactDescription: string;
}

export const SYSTEM_MODULE_DEFINITIONS: SystemModuleDefinition[] = [
  {
    key: "module.org_chart.enabled",
    moduleKey: "org_chart",
    name: "Bagan Organisasi (Org Chart)",
    category: "hris",
    description: "Visualisasi interaktif bagan hirarki organisasi dan posisi atasan-bawahan staf.",
    defaultEnabled: true,
    affectedNavItems: ["Bagan Organisasi (/karyawan/struktur)"],
    affectedRoutes: ["/karyawan/struktur"],
    impactDescription:
      "Menyembunyikan menu navigasi Bagan Organisasi di sidebar seluruh peran (Admin HR, Manajer, Staf) serta mengalihkan akses URL langsung.",
  },
  {
    key: "module.organization_structure.enabled",
    moduleKey: "organization_structure",
    name: "Struktur Organisasi (Departemen & Unit)",
    category: "hris",
    description: "Pengelolaan struktur unit kerja, departemen, dan formasi hierarki organisasi.",
    defaultEnabled: true,
    affectedNavItems: ["Struktur Organisasi (/karyawan/organisasi)"],
    affectedRoutes: ["/karyawan/organisasi"],
    impactDescription:
      "Menyembunyikan menu Struktur Organisasi di sidebar Admin HR dan mengalihkan akses URL langsung ke daftar karyawan.",
  },
  {
    key: "module.performance.enabled",
    moduleKey: "performance",
    name: "Manajemen Kinerja (Performance)",
    category: "hris",
    description:
      "Penetapan sasaran kerja (KPI), evaluasi kinerja berkala, self-review, dan rekap scorecard.",
    defaultEnabled: true,
    affectedNavItems: [
      "Kinerja Organisasi (/kinerja)",
      "Kinerja Tim (/kinerja)",
      "Kinerja Saya (/kinerja)",
    ],
    affectedRoutes: ["/kinerja"],
    impactDescription:
      "Menyembunyikan menu Kinerja di sidebar seluruh peran dan menonaktifkan rute /kinerja bagi seluruh karyawan.",
  },
  {
    key: "module.timesheet.enabled",
    moduleKey: "timesheet",
    name: "Timesheet Staf Per Jam & Freelance",
    category: "hris",
    description:
      "Pencatatan jam kerja lembar waktu harian staf lepas/hourly serta alur persetujuan manajer.",
    defaultEnabled: true,
    affectedNavItems: [
      "Timesheet Freelance (/timesheet/persetujuan)",
      "Persetujuan Timesheet (/timesheet/persetujuan)",
      "Timesheet Saya (/timesheet)",
    ],
    affectedRoutes: ["/timesheet", "/timesheet/persetujuan"],
    impactDescription:
      "Menyembunyikan menu Timesheet di sidebar Admin HR, Manajer, dan Layanan Mandiri staf per jam, serta memblokir rute /timesheet.",
  },
  {
    key: "module.recruitment.enabled",
    moduleKey: "recruitment",
    name: "Rekrutmen & Pelacak Pelamar (ATS)",
    category: "hris",
    description:
      "Manajemen lowongan kerja, seleksi berkas kandidat pelamar, dan jadwal wawancara kerja.",
    defaultEnabled: false,
    affectedNavItems: ["Rekrutmen (/rekrutmen)"],
    affectedRoutes: ["/rekrutmen"],
    impactDescription: "Mengontrol visibilitas dan ketersediaan modul rekrutmen pegawai baru.",
  },
  {
    key: "module.training.enabled",
    moduleKey: "training",
    name: "Pelatihan & Pengembangan Kompetensi",
    category: "hris",
    description:
      "Pengelolaan program pelatihan staf, sertifikasi keahlian, dan anggaran pengembangan SDM.",
    defaultEnabled: false,
    affectedNavItems: ["Pelatihan (/pelatihan)"],
    affectedRoutes: ["/pelatihan"],
    impactDescription: "Mengontrol visibilitas dan ketersediaan modul pelatihan organisasi.",
  },
];

export type ModuleFlags = Record<string, boolean>;

/**
 * Mengambil map status seluruh modul aktif/nonaktif dari database.
 * Jika setting belum ada di database, menggunakan nilai bawaan defaultEnabled.
 */
export async function getModuleFlags(dbClient: PrismaClient): Promise<ModuleFlags> {
  const flags: ModuleFlags = {};

  // 1. Inisialisasi dengan nilai default
  for (const mod of SYSTEM_MODULE_DEFINITIONS) {
    flags[mod.moduleKey] = mod.defaultEnabled;
    flags[mod.key] = mod.defaultEnabled;
  }

  try {
    // 2. Timpa dengan konfigurasi yang ada di database
    const settings = await dbClient.systemSetting.findMany({
      where: { category: "MODULE" },
    });

    for (const setting of settings) {
      const isEnabled = setting.value === "true";
      flags[setting.key] = isEnabled;

      // Cari moduleKey singkat yang cocok
      const def = SYSTEM_MODULE_DEFINITIONS.find((m) => m.key === setting.key);
      if (def) {
        flags[def.moduleKey] = isEnabled;
      }
    }
  } catch (error) {
    console.error(
      "Gagal membaca konfigurasi modul dari database, menggunakan fallback default:",
      error,
    );
  }

  return flags;
}

/**
 * Helper untuk mengecek apakah modul tertentu aktif.
 */
export function isModuleActive(flags: ModuleFlags, moduleKeyOrDbKey: string): boolean {
  if (moduleKeyOrDbKey in flags) {
    return Boolean(flags[moduleKeyOrDbKey]);
  }
  const def = SYSTEM_MODULE_DEFINITIONS.find(
    (m) => m.moduleKey === moduleKeyOrDbKey || m.key === moduleKeyOrDbKey,
  );
  return def ? def.defaultEnabled : true;
}
