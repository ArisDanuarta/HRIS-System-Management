import { prisma, SYSTEM_MODULE_DEFINITIONS, SystemModuleDefinition } from "@pspk/db";

export interface ModuleConfigItem extends SystemModuleDefinition {
  isEnabled: boolean;
  updatedAt: Date | null;
  updatedBy: string | null;
}

export interface ModuleGovernanceData {
  modules: ModuleConfigItem[];
  stats: {
    total: number;
    activeCount: number;
    inactiveCount: number;
  };
}

/**
 * Mengambil seluruh data modul sistem PSPK beserta status aktif/nonaktif dan riwayat pembaruannya.
 */
export async function getModuleGovernanceData(): Promise<ModuleGovernanceData> {
  // 1. Ambil pengaturan tersimpan dari database
  const savedSettings = await prisma.systemSetting.findMany({
    where: { category: "MODULE" },
  });

  const settingsMap = new Map<
    string,
    { value: string; updatedAt: Date; updatedBy: string | null }
  >();

  for (const s of savedSettings) {
    settingsMap.set(s.key, {
      value: s.value,
      updatedAt: s.updatedAt,
      updatedBy: s.updatedBy,
    });
  }

  // 2. Gabungkan dengan definisi standar modul
  const modules: ModuleConfigItem[] = SYSTEM_MODULE_DEFINITIONS.map((def) => {
    const saved = settingsMap.get(def.key);

    return {
      ...def,
      isEnabled: saved ? saved.value === "true" : def.defaultEnabled,
      updatedAt: saved ? saved.updatedAt : null,
      updatedBy: saved ? saved.updatedBy : null,
    };
  });

  const activeCount = modules.filter((m) => m.isEnabled).length;
  const inactiveCount = modules.length - activeCount;

  return {
    modules,
    stats: {
      total: modules.length,
      activeCount,
      inactiveCount,
    },
  };
}
