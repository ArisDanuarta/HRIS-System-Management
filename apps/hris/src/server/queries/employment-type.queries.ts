import { prisma } from "@pspk/db";

export interface EmploymentTypeDetail {
  id: string;
  code: string;
  name: string;
  category: "PERMANENT" | "FIXED_TERM" | "PART_TIME_PROJECT";
  wageType: "MONTHLY" | "HOURLY";
  defaultHourlyRate: number | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    contracts: number;
  };
}

/**
 * Mengambil seluruh master tipe ikatan kerja untuk tabel manajemen Admin HR
 */
export async function getEmploymentTypes(): Promise<EmploymentTypeDetail[]> {
  const types = await prisma.employmentTypeMaster.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          contracts: {
            where: { status: "ACTIVE" },
          },
        },
      },
    },
  });

  return types.map((t) => ({
    id: t.id,
    code: t.code,
    name: t.name,
    category: t.category,
    wageType: t.wageType,
    defaultHourlyRate: t.defaultHourlyRate ? Number(t.defaultHourlyRate) : null,
    description: t.description,
    isActive: t.isActive,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    _count: t._count,
  }));
}

/**
 * Mengambil daftar tipe ikatan kerja aktif untuk opsi pilihan form pendaftaran pegawai
 */
export async function getActiveEmploymentTypes() {
  const types = await prisma.employmentTypeMaster.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
      category: true,
      wageType: true,
      defaultHourlyRate: true,
      description: true,
    },
  });

  return types.map((t) => ({
    id: t.id,
    code: t.code,
    name: t.name,
    category: t.category,
    wageType: t.wageType,
    defaultHourlyRate: t.defaultHourlyRate ? Number(t.defaultHourlyRate) : null,
    description: t.description,
  }));
}
