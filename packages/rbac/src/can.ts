export class ForbiddenError extends Error {
  constructor(permission: string) {
    super(`Akses ditolak: Anda tidak memiliki izin [${permission}] untuk melakukan aksi ini.`);
    this.name = "ForbiddenError";
  }
}

export type AuthContext = {
  userId: string;
  employeeId: string | null;
  roles: string[];
  permissions: ReadonlySet<string>;
};

export type Resource = {
  ownerEmployeeId?: string | null;
  managerEmployeeId?: string | null;
};

/**
 * Checks whether the current context has permission to execute an action.
 * @param ctx AuthContext loaded for the request
 * @param permission Base permission name without scope (e.g. "hris.leave.read")
 * @param resource Optional resource info to resolve "own" or "team" scope
 */
export function can(ctx: AuthContext, permission: string, resource?: Resource): boolean {
  // Super admin check shortcut or wildcard
  if (ctx.roles.includes("super_admin")) return true;

  // 1. Check ":all" scope
  if (ctx.permissions.has(`${permission}:all`)) return true;

  // 2. Check ":team" scope (requester is manager of resource)
  if (
    resource?.managerEmployeeId &&
    ctx.employeeId &&
    ctx.employeeId === resource.managerEmployeeId &&
    ctx.permissions.has(`${permission}:team`)
  ) {
    return true;
  }

  // 3. Check ":own" scope (requester is owner of resource)
  if (
    resource?.ownerEmployeeId &&
    ctx.employeeId &&
    ctx.employeeId === resource.ownerEmployeeId &&
    ctx.permissions.has(`${permission}:own`)
  ) {
    return true;
  }

  // Exact match check (if full permission string with scope was passed directly)
  if (ctx.permissions.has(permission)) return true;

  return false;
}

/**
 * Throws ForbiddenError if context does not have required permission.
 */
export function assertCan(ctx: AuthContext, permission: string, resource?: Resource): void {
  if (!can(ctx, permission, resource)) {
    throw new ForbiddenError(permission);
  }
}
