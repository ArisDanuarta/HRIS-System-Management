import { prisma } from "@pspk/db";

export interface OrgChartNode {
  id: string;
  fullName: string;
  nickname: string | null;
  employeeNo: string;
  workEmail: string;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
  departmentId: string | null;
  departmentName: string;
  positionId: string | null;
  positionTitle: string;
  employmentTypeName: string;
  managerId: string | null;
  managerName?: string | null;
  level: number;
  directReportsCount: number;
  totalSubordinatesCount: number;
  children: OrgChartNode[];
}

export interface OrgChartData {
  rootNodes: OrgChartNode[];
  unassignedEmployees: OrgChartNode[];
  departments: Array<{ id: string; name: string; count: number }>;
  totalEmployees: number;
  totalManagers: number;
  maxDepth: number;
}

/**
 * Mengambil seluruh pegawai aktif dan membentuk pohon hierarki organisasi (Org Chart)
 */
export async function getOrgChartData(): Promise<OrgChartData> {
  const employees = await prisma.employee.findMany({
    where: {
      deletedAt: null,
      status: { not: "TERMINATED" },
    },
    select: {
      id: true,
      fullName: true,
      nickname: true,
      employeeNo: true,
      workEmail: true,
      phone: true,
      photoKey: true,
      status: true,
      managerId: true,
      currentDepartment: {
        select: {
          id: true,
          name: true,
        },
      },
      currentPosition: {
        select: {
          id: true,
          title: true,
        },
      },
      contracts: {
        where: { status: "ACTIVE" },
        take: 1,
        select: {
          type: true,
          employmentTypeMaster: {
            select: { name: true },
          },
        },
      },
      _count: {
        select: {
          directReports: {
            where: {
              deletedAt: null,
              status: { not: "TERMINATED" },
            },
          },
        },
      },
    },
    orderBy: [{ currentDepartment: { name: "asc" } }, { fullName: "asc" }],
  });

  const nodesMap = new Map<string, OrgChartNode>();
  const deptMap = new Map<string, { id: string; name: string; count: number }>();

  for (const emp of employees) {
    const activeContract = emp.contracts[0];
    const employmentTypeName =
      activeContract?.employmentTypeMaster?.name || activeContract?.type || "Pegawai Tetap";
    const avatarUrl = emp.photoKey ? `/api/documents/${emp.photoKey}` : null;

    if (emp.currentDepartment) {
      const d = emp.currentDepartment;
      const existing = deptMap.get(d.id);
      if (existing) {
        existing.count++;
      } else {
        deptMap.set(d.id, { id: d.id, name: d.name, count: 1 });
      }
    }

    nodesMap.set(emp.id, {
      id: emp.id,
      fullName: emp.fullName,
      nickname: emp.nickname,
      employeeNo: emp.employeeNo,
      workEmail: emp.workEmail,
      phone: emp.phone,
      avatarUrl,
      status: emp.status,
      departmentId: emp.currentDepartment?.id || null,
      departmentName: emp.currentDepartment?.name || "Umum & Organisasi",
      positionId: emp.currentPosition?.id || null,
      positionTitle: emp.currentPosition?.title || "Staf Riset",
      employmentTypeName,
      managerId: emp.managerId,
      level: 1,
      directReportsCount: emp._count.directReports,
      totalSubordinatesCount: 0,
      children: [],
    });
  }

  const rootCandidates: OrgChartNode[] = [];
  const unassignedEmployees: OrgChartNode[] = [];

  for (const [id, node] of nodesMap.entries()) {
    if (node.managerId && nodesMap.has(node.managerId) && node.managerId !== id) {
      const parent = nodesMap.get(node.managerId)!;
      parent.children.push(node);
      node.managerName = parent.fullName;
    } else if (node.managerId && !nodesMap.has(node.managerId)) {
      // Atasan tidak ditemukan di daftar pegawai aktif
      if (node.directReportsCount > 0) {
        rootCandidates.push(node);
      } else {
        unassignedEmployees.push(node);
      }
    } else {
      // managerId === null (Puncak pimpinan atau belum ditugaskan atasan)
      const isLeadership =
        node.directReportsCount > 0 ||
        /direktur|ketua|lead|kepala|manajer|manager|pengurus/i.test(node.positionTitle);

      if (isLeadership) {
        rootCandidates.push(node);
      } else {
        unassignedEmployees.push(node);
      }
    }
  }

  // Jika tidak ada rootCandidate sama sekali tapi ada pegawai, angkat pegawai pertama sebagai root
  if (rootCandidates.length === 0 && unassignedEmployees.length > 0) {
    const fallbackRoot = unassignedEmployees.shift()!;
    rootCandidates.push(fallbackRoot);
  }

  let maxDepth = 1;
  let totalManagers = 0;

  function calculateSubordinatesAndLevels(node: OrgChartNode, currentLevel: number): number {
    node.level = currentLevel;
    if (currentLevel > maxDepth) {
      maxDepth = currentLevel;
    }
    if (node.children.length > 0) {
      totalManagers++;
      // Urutkan anak cabang: yang memiliki bawahan ditaruh di awal, lalu berdasarkan abjad
      node.children.sort((a, b) => {
        if (b.children.length !== a.children.length) {
          return b.children.length - a.children.length;
        }
        return a.fullName.localeCompare(b.fullName);
      });
    }

    let count = node.children.length;
    for (const child of node.children) {
      count += calculateSubordinatesAndLevels(child, currentLevel + 1);
    }
    node.totalSubordinatesCount = count;
    return count;
  }

  for (const root of rootCandidates) {
    calculateSubordinatesAndLevels(root, 1);
  }

  // Urutkan kandidat root pimpinan tertinggi
  rootCandidates.sort((a, b) => b.totalSubordinatesCount - a.totalSubordinatesCount);

  return {
    rootNodes: rootCandidates,
    unassignedEmployees,
    departments: Array.from(deptMap.values()).sort((a, b) => b.count - a.count),
    totalEmployees: employees.length,
    totalManagers,
    maxDepth,
  };
}
