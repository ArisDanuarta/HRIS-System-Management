import { describe, it, expect } from "vitest";
import { PERMISSIONS } from "@pspk/rbac";
import {
  parsePermissionKey,
  RESOURCE_METADATA,
  SYSTEM_ROLE_ORDER,
} from "./role.queries";

describe("RBAC Role Queries & Parser Helper", () => {
  it("mengurai format permission key standar dengan benar", () => {
    const parsed = parsePermissionKey("hris.employee.read:own");
    expect(parsed).toEqual({
      module: "hris",
      resource: "employee",
      action: "read",
      scope: "own",
    });
  });

  it("mengurai permission dengan scope kustom (sync/connect/hr)", () => {
    const holidaySync = parsePermissionKey("hris.calendar.holiday:sync");
    expect(holidaySync).toEqual({
      module: "hris",
      resource: "calendar",
      action: "holiday",
      scope: "sync",
    });

    const docHr = parsePermissionKey("sysmgmt.document.manage:hr");
    expect(docHr).toEqual({
      module: "sysmgmt",
      resource: "document",
      action: "manage",
      scope: "hr",
    });
  });

  it("memastikan seluruh 56+ sistem permission di @pspk/rbac terpetakan di RESOURCE_METADATA", () => {
    const unmappedResources = new Set<string>();

    for (const perm of PERMISSIONS) {
      const { resource } = parsePermissionKey(perm.key);
      if (!RESOURCE_METADATA[resource]) {
        unmappedResources.add(resource);
      }
    }

    expect(
      Array.from(unmappedResources),
      `Ditemukan resource permission yang belum terdaftar di RESOURCE_METADATA: ${Array.from(unmappedResources).join(", ")}`,
    ).toEqual([]);
  });

  it("memastikan urutan peran sistem SYSTEM_ROLE_ORDER lengkap dengan 5 peran pokok", () => {
    expect(SYSTEM_ROLE_ORDER).toEqual([
      "super_admin",
      "admin_it",
      "admin_hr",
      "manager",
      "staff",
    ]);
  });
});
