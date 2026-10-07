import { prisma } from "@pspk/db";

/**
 * Metadata Pengelompokan Sumber Daya (Resource) ke Kategori Bahasa Indonesia
 */
export const RESOURCE_METADATA: Record<
  string,
  { label: string; app: "hris" | "sysmgmt"; order: number }
> = {
  // HRIS Core & Modul Tambahan
  employee: { label: "Data Karyawan & Profil", app: "hris", order: 1 },
  org: { label: "Struktur & Bagan Organisasi", app: "hris", order: 2 },
  contract: { label: "Kontrak & Ikatan Kerja", app: "hris", order: 3 },
  attendance: { label: "Presensi & Kehadiran", app: "hris", order: 4 },
  leave: { label: "Manajemen Cuti & Izin", app: "hris", order: 5 },
  calendar: { label: "Kalender Kerja", app: "hris", order: 6 },
  payroll: { label: "Penggajian (Payroll)", app: "hris", order: 7 },
  payslip: { label: "Slip Gaji Karyawan", app: "hris", order: 8 },
  timesheet: { label: "Timesheet Pegawai Lepas", app: "hris", order: 9 },
  performance: { label: "Kinerja & Evaluasi (KPI)", app: "hris", order: 10 },
  recruitment: { label: "Rekrutmen & Pelamar", app: "hris", order: 11 },
  training: { label: "Pelatihan & Sertifikasi", app: "hris", order: 12 },

  // System Management
  dashboard: { label: "Dashboard Tata Kelola", app: "sysmgmt", order: 20 },
  user: { label: "Manajemen Akun Pengguna", app: "sysmgmt", order: 21 },
  role: { label: "Peran & Hak Akses (RBAC)", app: "sysmgmt", order: 22 },
  asset: { label: "Inventaris Aset Fisik", app: "sysmgmt", order: 23 },
  license: { label: "Lisensi Perangkat Lunak", app: "sysmgmt", order: 24 },
  document: { label: "Repositori Dokumen & SOP", app: "sysmgmt", order: 25 },
  audit: { label: "Buku Besar Audit Log", app: "sysmgmt", order: 26 },
};

/**
 * Urutan Tampilan Peran Sistem dari Level Tertinggi ke Terendah
 */
export const SYSTEM_ROLE_ORDER = [
  "super_admin",
  "admin_it",
  "admin_hr",
  "manager",
  "staff",
] as const;

export interface RoleSummaryItem {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  permissionCount: number;
  createdAt: Date;
}

export interface PermissionMatrixItem {
  id: string;
  key: string;
  module: "hris" | "sysmgmt";
  resource: string;
  action: string;
  scope: string; // own | team | all | sync | connect | hr
  description: string;
  roleAccess: Record<string, boolean>; // key peran -> boolean memiliki akses
}

export interface CategoryMatrixGroup {
  categoryKey: string;
  categoryLabel: string;
  app: "hris" | "sysmgmt";
  permissions: PermissionMatrixItem[];
}

export interface RoleMatrixData {
  roles: RoleSummaryItem[];
  categories: CategoryMatrixGroup[];
  stats: {
    totalRoles: number;
    totalPermissions: number;
    totalHrisPermissions: number;
    totalSysmgmtPermissions: number;
    totalAssignedUsers: number;
  };
}

/**
 * Helper untuk mengurai kunci permission menjadi bagian-bagian terstruktur.
 * Format: <modul>.<resource>.<aksi>:<scope>
 */
export function parsePermissionKey(key: string) {
  const [base, scope = "all"] = key.split(":");
  const parts = base?.split(".") || [];
  const moduleName = (parts[0] || "hris") as "hris" | "sysmgmt";
  const resource = parts[1] || "general";
  const action = parts.slice(2).join(".") || "manage";

  return {
    module: moduleName,
    resource,
    action,
    scope,
  };
}

/**
 * Mengambil seluruh peran sistem beserta statistik jumlah pengguna dan daftar permission.
 */
export async function getRolesWithPermissions() {
  const rawRoles = await prisma.role.findMany({
    include: {
      _count: {
        select: {
          users: true,
          permissions: true,
        },
      },
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  // Urutkan berdasarkan hierarki wewenang sistem
  const sortedRoles = [...rawRoles].sort((a, b) => {
    const indexA = SYSTEM_ROLE_ORDER.indexOf(a.key as (typeof SYSTEM_ROLE_ORDER)[number]);
    const indexB = SYSTEM_ROLE_ORDER.indexOf(b.key as (typeof SYSTEM_ROLE_ORDER)[number]);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    return a.name.localeCompare(b.name);
  });

  return sortedRoles.map((role) => ({
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    createdAt: role.createdAt,
    userCount: role._count.users,
    permissionCount: role._count.permissions,
    permissions: role.permissions.map((rp) => rp.permission),
    permissionKeys: role.permissions.map((rp) => rp.permission.key),
  }));
}

/**
 * Mengambil data matriks lengkap antara Peran Sistem vs Seluruh Permission
 * untuk keperluan visualisasi grid RBAC.
 */
export async function getRoleMatrixData(): Promise<RoleMatrixData> {
  const [roles, allPermissions, totalAssignedUsers] = await Promise.all([
    getRolesWithPermissions(),
    prisma.permission.findMany({
      orderBy: { key: "asc" },
    }),
    prisma.userRole.count(),
  ]);

  // Siapkan map permission per role untuk pengecekan cepat O(1)
  const rolePermissionMap = new Map<string, Set<string>>();
  for (const role of roles) {
    rolePermissionMap.set(role.key, new Set(role.permissionKeys));
  }

  // Petakan setiap permission ke dalam item matriks
  const matrixItems: PermissionMatrixItem[] = allPermissions.map((perm) => {
    const parsed = parsePermissionKey(perm.key);
    const roleAccess: Record<string, boolean> = {};

    for (const role of roles) {
      // Super admin selalu memiliki seluruh akses
      if (role.key === "super_admin") {
        roleAccess[role.key] = true;
      } else {
        const hasAccess = rolePermissionMap.get(role.key)?.has(perm.key) ?? false;
        roleAccess[role.key] = hasAccess;
      }
    }

    return {
      id: perm.id,
      key: perm.key,
      module: parsed.module,
      resource: parsed.resource,
      action: parsed.action,
      scope: parsed.scope,
      description: perm.description || perm.key,
      roleAccess,
    };
  });

  // Kelompokkan permission berdasarkan kategori resource
  const categoryGroupsMap = new Map<string, PermissionMatrixItem[]>();

  for (const item of matrixItems) {
    const list = categoryGroupsMap.get(item.resource) || [];
    list.push(item);
    categoryGroupsMap.set(item.resource, list);
  }

  const categories: CategoryMatrixGroup[] = [];

  categoryGroupsMap.forEach((perms, resourceKey) => {
    const meta = RESOURCE_METADATA[resourceKey] || {
      label: `Modul ${resourceKey.toUpperCase()}`,
      app: (perms[0]?.module || "hris") as "hris" | "sysmgmt",
      order: 99,
    };

    categories.push({
      categoryKey: resourceKey,
      categoryLabel: meta.label,
      app: meta.app,
      permissions: perms,
    });
  });

  // Urutkan kategori berdasarkan `order`
  categories.sort((a, b) => {
    const orderA = RESOURCE_METADATA[a.categoryKey]?.order ?? 99;
    const orderB = RESOURCE_METADATA[b.categoryKey]?.order ?? 99;
    return orderA - orderB;
  });

  const totalHrisPermissions = matrixItems.filter((i) => i.module === "hris").length;
  const totalSysmgmtPermissions = matrixItems.filter((i) => i.module === "sysmgmt").length;

  const roleSummaries: RoleSummaryItem[] = roles.map((r) => ({
    id: r.id,
    key: r.key,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    userCount: r.userCount,
    permissionCount: r.permissionCount,
    createdAt: r.createdAt,
  }));

  return {
    roles: roleSummaries,
    categories,
    stats: {
      totalRoles: roles.length,
      totalPermissions: allPermissions.length,
      totalHrisPermissions,
      totalSysmgmtPermissions,
      totalAssignedUsers,
    },
  };
}

/**
 * Mengambil detail satu peran spesifik, termasuk daftar personil yang ditugaskan ke peran ini.
 */
export async function getRoleDetail(roleKey: string) {
  const role = await prisma.role.findUnique({
    where: { key: roleKey },
    include: {
      users: {
        include: {
          user: {
            include: {
              employee: {
                select: {
                  id: true,
                  fullName: true,
                  employeeNo: true,
                  currentDepartment: { select: { name: true } },
                  currentPosition: { select: { title: true } },
                },
              },
            },
          },
        },
      },
      permissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (!role) return null;

  return {
    id: role.id,
    key: role.key,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    createdAt: role.createdAt,
    assignedUsers: role.users.map((ur) => ({
      userId: ur.user.id,
      email: ur.user.email,
      name: ur.user.name,
      isActive: ur.user.isActive,
      assignedAt: ur.assignedAt,
      employee: ur.user.employee,
    })),
    permissions: role.permissions.map((rp) => rp.permission),
  };
}
