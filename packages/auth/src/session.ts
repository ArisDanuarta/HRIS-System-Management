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
    employeeId: user.employee?.id ?? null,
    roles: roleKeys,
    permissions: permissionsSet,
  };
}

/**
 * Loads full user profile with roles and linked employee details for UI shell.
 */
export async function getUserProfile(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isActive: true,
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
}

