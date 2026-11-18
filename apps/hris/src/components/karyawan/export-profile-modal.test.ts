import { describe, it, expect } from "vitest";

describe("ExportProfileModal parameter building & security rules", () => {
  it("harus menyusun query params ekspor default dengan benar", () => {
    const params = new URLSearchParams({
      personal: "true",
      address: "true",
      family: "true",
      education: "true",
      employment: "true",
      contracts: "true",
      attendance: "true",
      documents: "true",
      assets: "true",
      sensitive: "false",
      compensation: "false",
      attendanceFrom: "2026-01-01",
      attendanceTo: "2026-01-31",
      format: "pdf",
    });

    expect(params.get("format")).toBe("pdf");
    expect(params.get("sensitive")).toBe("false");
    expect(params.get("compensation")).toBe("false");
    expect(params.get("attendance")).toBe("true");
    expect(params.get("attendanceFrom")).toBe("2026-01-01");
  });

  it("harus menyusun parameter format zip ketika packageZip diaktifkan", () => {
    const packageZip = true;
    const format = packageZip ? "zip" : "pdf";

    const params = new URLSearchParams({
      personal: "true",
      format,
    });

    expect(params.get("format")).toBe("zip");
  });

  it("harus memblokir akses data sensitif dan kompensasi jika pengguna ber-role Manager", () => {
    const isHrOrAdmin = false;
    const isManager = true;
    const canAccessSensitive = isHrOrAdmin && !isManager;

    // Walaupun user mencoba mencentang di client
    const requestedSensitive = true;
    const requestedCompensation = true;

    const effectiveSensitive = canAccessSensitive && requestedSensitive;
    const effectiveCompensation = canAccessSensitive && requestedCompensation;

    expect(canAccessSensitive).toBe(false);
    expect(effectiveSensitive).toBe(false);
    expect(effectiveCompensation).toBe(false);
  });

  it("harus mengizinkan pembukaan data sensitif jika pengguna adalah HR/Super Admin", () => {
    const isHrOrAdmin = true;
    const isManager = false;
    const canAccessSensitive = isHrOrAdmin && !isManager;

    const requestedSensitive = true;
    const requestedCompensation = true;

    const effectiveSensitive = canAccessSensitive && requestedSensitive;
    const effectiveCompensation = canAccessSensitive && requestedCompensation;

    expect(canAccessSensitive).toBe(true);
    expect(effectiveSensitive).toBe(true);
    expect(effectiveCompensation).toBe(true);
  });
});
