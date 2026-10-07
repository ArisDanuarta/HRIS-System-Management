import { describe, it, expect } from "vitest";
import { can, assertCan, AuthContext, ForbiddenError } from "./can";

describe("RBAC can() & assertCan()", () => {
  const staffContext: AuthContext = {
    userId: "u-staff-1",
    employeeId: "emp-staff-1",
    roles: ["staff"],
    permissions: new Set(["hris.leave.read:own", "hris.leave.create:own"]),
  };

  const managerContext: AuthContext = {
    userId: "u-mgr-1",
    employeeId: "emp-mgr-1",
    roles: ["manager"],
    permissions: new Set([
      "hris.leave.read:own",
      "hris.leave.read:team",
      "hris.leave.approve:team",
    ]),
  };

  const adminContext: AuthContext = {
    userId: "u-admin-1",
    employeeId: "emp-admin-1",
    roles: ["admin_hr"],
    permissions: new Set(["hris.leave.read:all", "hris.leave.approve:all"]),
  };

  it("permits staff to read their own leave", () => {
    expect(can(staffContext, "hris.leave.read", { ownerEmployeeId: "emp-staff-1" })).toBe(true);
  });

  it("denies staff from reading other employees leave", () => {
    expect(can(staffContext, "hris.leave.read", { ownerEmployeeId: "emp-other" })).toBe(false);
  });

  it("permits manager to approve direct report leave", () => {
    expect(
      can(managerContext, "hris.leave.approve", {
        ownerEmployeeId: "emp-staff-1",
        managerEmployeeId: "emp-mgr-1",
      }),
    ).toBe(true);
  });

  it("denies manager from approving non-team leave", () => {
    expect(
      can(managerContext, "hris.leave.approve", {
        ownerEmployeeId: "emp-other",
        managerEmployeeId: "emp-other-mgr",
      }),
    ).toBe(false);
  });

  it("permits admin with :all scope unconditionally", () => {
    expect(can(adminContext, "hris.leave.read", { ownerEmployeeId: "emp-any" })).toBe(true);
    expect(can(adminContext, "hris.leave.approve", { ownerEmployeeId: "emp-any" })).toBe(true);
  });

  it("assertCan throws ForbiddenError on unauthorized access", () => {
    expect(() => {
      assertCan(staffContext, "hris.leave.approve", { ownerEmployeeId: "emp-other" });
    }).toThrowError(ForbiddenError);
  });

  describe("System Management RBAC Permissions", () => {
    const itAdminContext: AuthContext = {
      userId: "u-it-1",
      employeeId: null,
      roles: ["admin_it"],
      permissions: new Set([
        "sysmgmt.dashboard.read:all",
        "sysmgmt.user.read:all",
        "sysmgmt.user.manage:all",
        "sysmgmt.role.read:all",
        "sysmgmt.role.manage:all",
      ]),
    };

    const superAdminContext: AuthContext = {
      userId: "u-super-1",
      employeeId: null,
      roles: ["super_admin"],
      permissions: new Set(),
    };

    it("permits Admin IT to manage users and view role matrix", () => {
      expect(can(itAdminContext, "sysmgmt.user.manage")).toBe(true);
      expect(can(itAdminContext, "sysmgmt.role.read")).toBe(true);
      expect(can(itAdminContext, "sysmgmt.role.manage")).toBe(true);
    });

    it("permits Super Admin to perform all sysmgmt operations via wildcard/shortcut", () => {
      expect(can(superAdminContext, "sysmgmt.user.manage")).toBe(true);
      expect(can(superAdminContext, "sysmgmt.role.manage")).toBe(true);
      expect(can(superAdminContext, "sysmgmt.role.read")).toBe(true);
    });

    it("denies Staff and HR Admin from managing IT roles in system management", () => {
      expect(can(staffContext, "sysmgmt.user.manage")).toBe(false);
      expect(can(staffContext, "sysmgmt.role.manage")).toBe(false);
      expect(can(adminContext, "sysmgmt.role.manage")).toBe(false);

      expect(() => {
        assertCan(staffContext, "sysmgmt.role.manage");
      }).toThrowError(ForbiddenError);
    });
  });
});
