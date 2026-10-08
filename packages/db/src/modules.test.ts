import { describe, it, expect } from "vitest";
import { SYSTEM_MODULE_DEFINITIONS, isModuleActive, ModuleFlags } from "./modules";

describe("System Modules & Feature Flags", () => {
  it("harus memiliki 8 definisi modul sistem terstandarisasi", () => {
    expect(SYSTEM_MODULE_DEFINITIONS).toHaveLength(8);

    const keys = SYSTEM_MODULE_DEFINITIONS.map((m) => m.moduleKey);
    expect(keys).toContain("org_chart");
    expect(keys).toContain("organization_structure");
    expect(keys).toContain("performance");
    expect(keys).toContain("timesheet");
    expect(keys).toContain("recruitment");
    expect(keys).toContain("training");
    expect(keys).toContain("asset_management");
    expect(keys).toContain("asset_assignment");
  });

  it("harus memiliki rute terdampak yang jelas untuk modul inti yang dapat di-toggle", () => {
    const orgChart = SYSTEM_MODULE_DEFINITIONS.find((m) => m.moduleKey === "org_chart");
    expect(orgChart?.affectedRoutes).toContain("/karyawan/struktur");

    const performance = SYSTEM_MODULE_DEFINITIONS.find((m) => m.moduleKey === "performance");
    expect(performance?.affectedRoutes).toContain("/kinerja");

    const timesheet = SYSTEM_MODULE_DEFINITIONS.find((m) => m.moduleKey === "timesheet");
    expect(timesheet?.affectedRoutes).toContain("/timesheet");
    expect(timesheet?.affectedRoutes).toContain("/timesheet/persetujuan");
  });

  it("isModuleActive harus mengecek status modul dengan benar berdasarkan flags", () => {
    const flags: ModuleFlags = {
      org_chart: false,
      performance: true,
      timesheet: false,
    };

    expect(isModuleActive(flags, "org_chart")).toBe(false);
    expect(isModuleActive(flags, "performance")).toBe(true);
    expect(isModuleActive(flags, "timesheet")).toBe(false);

    // Fallback jika tidak ada di flags: mengacu ke defaultEnabled
    expect(isModuleActive(flags, "organization_structure")).toBe(true);
    expect(isModuleActive(flags, "recruitment")).toBe(false);
  });
});
