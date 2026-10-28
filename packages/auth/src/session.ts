import { prisma } from "@pspk/db";
import { AuthContext } from "@pspk/rbac";
import { auth } from "./index";

/**
 * Retrieves the active Better Auth session using standard Web Headers.
 */
export async function getSession(headers: Headers) {
  return await auth.api.getSession({ headers });
}

/**
 * Loads the user's role keys, permissions set, and linked employeeId from database.
 * Used to construct the AuthContext for RBAC checks in server operations.
 */
export async function getAuthContext(userId: string): Promise<AuthContext | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      employee: {
        select: { id: true },
      },
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  let employeeId = user.employee?.id ?? null;

  // Auto-heal link jika employeeId belum terhubung tapi ada data pegawai dengan email yang cocok
  if (!employeeId && user.email) {
    try {
      const matchedEmp = await prisma.employee.findFirst({
        where: {
          OR: [
            { workEmail: user.email },
            { personalEmail: user.email },
          ],
        },
        select: { id: true, userId: true },
      });

      if (matchedEmp) {
        employeeId = matchedEmp.id;
        if (!matchedEmp.userId) {
          await prisma.employee.update({
            where: { id: matchedEmp.id },
            data: { userId: user.id },
          });
        }
      }
    } catch {
      // Abaikan jika error konkurensi database
    }
  }

  const roleKeys: string[] = [];
  const permissionsSet = new Set<string>();

  for (const userRole of user.roles) {
    roleKeys.push(userRole.role.key);
    for (const rp of userRole.role.permissions) {
      permissionsSet.add(rp.permission.key);
    }
  }

  return {
    userId: user.id,
    employeeId,
    roles: roleKeys,
    permissions: permissionsSet,
  };
}

/**
 * Loads full user profile with roles and linked employee details for UI shell.
 */
export async function getUserProfile(userId: string) {
  const profile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isActive: true,
      mustChangePassword: true,
      passwordChangedAt: true,
      roles: {
        select: {
          role: {
            select: {
              key: true,
              name: true,
            },
          },
        },
      },
      employee: {
        select: {
          id: true,
          employeeNo: true,
          fullName: true,
          nickname: true,
          workEmail: true,
          currentDepartmentId: true,
          currentPosition: {
            select: { title: true },
          },
          currentDepartment: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (profile && !profile.employee && profile.email) {
    try {
      const matchedEmp = await prisma.employee.findFirst({
        where: {
          OR: [
            { workEmail: profile.email },
            { personalEmail: profile.email },
          ],
        },
        select: {
          id: true,
          employeeNo: true,
          fullName: true,
          nickname: true,
          workEmail: true,
          userId: true,
          currentDepartmentId: true,
          currentPosition: {
            select: { title: true },
          },
          currentDepartment: {
            select: { name: true },
          },
        },
      });

      if (matchedEmp) {
        if (!matchedEmp.userId) {
          await prisma.employee.update({
            where: { id: matchedEmp.id },
            data: { userId: profile.id },
          });
        }
        return {
          ...profile,
          employee: {
            id: matchedEmp.id,
            employeeNo: matchedEmp.employeeNo,
            fullName: matchedEmp.fullName,
            nickname: matchedEmp.nickname,
            workEmail: matchedEmp.workEmail,
            currentDepartmentId: matchedEmp.currentDepartmentId,
            currentPosition: matchedEmp.currentPosition,
            currentDepartment: matchedEmp.currentDepartment,
          },
        };
      }
    } catch {
      // Abaikan jika error pencocokan email
    }
  }

  return profile;
}

export type UserProfile = NonNullable<Awaited<ReturnType<typeof getUserProfile>>>;
