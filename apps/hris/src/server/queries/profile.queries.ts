import { prisma } from "@pspk/db";

export interface UserSessionItem {
  id: string;
  token: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent?: boolean;
}

export interface UserProfileData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isActive: boolean;
  createdAt: string;
  roles: Array<{
    key: string;
    name: string;
  }>;
  employee: {
    id: string;
    employeeNo: string;
    fullName: string;
    nickname: string | null;
    workEmail: string;
    phone: string | null;
    avatarUrl: string | null;
    employmentType: string;
    status: string;
    hireDate: string | null;
    department: string | null;
    position: string | null;
  } | null;
  sessions: UserSessionItem[];
}

/**
 * Mengambil profil lengkap user saat ini beserta data kepegawaian dan sesi aktif
 */
export async function getCurrentUserProfile(
  userId: string,
  currentToken?: string,
): Promise<UserProfileData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            select: {
              key: true,
              name: true,
            },
          },
        },
      },
      employee: {
        include: {
          currentDepartment: {
            select: { name: true },
          },
          currentPosition: {
            select: { title: true },
          },
        },
      },
      sessions: {
        where: {
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    roles: user.roles.map((r) => ({
      key: r.role.key,
      name: r.role.name,
    })),
    employee: user.employee
      ? {
          id: user.employee.id,
          employeeNo: user.employee.employeeNo,
          fullName: user.employee.fullName,
          nickname: user.employee.nickname,
          workEmail: user.employee.workEmail,
          phone: user.employee.phone,
          avatarUrl: user.employee.avatarUrl,
          employmentType: user.employee.employmentType,
          status: user.employee.status,
          hireDate: user.employee.hireDate ? user.employee.hireDate.toISOString() : null,
          department: user.employee.currentDepartment?.name ?? null,
          position: user.employee.currentPosition?.title ?? null,
        }
      : null,
    sessions: user.sessions.map((s) => ({
      id: s.id,
      token: s.token,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
      isCurrent: currentToken ? s.token === currentToken : false,
    })),
  };
}
