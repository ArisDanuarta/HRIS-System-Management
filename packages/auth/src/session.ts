import { prisma } from "@pspk/db";
import { AuthContext } from "@pspk/rbac";

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
