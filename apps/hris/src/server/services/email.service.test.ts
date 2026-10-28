import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  sendEmployeeCredentialsEmail,
  sendPasswordChangedConfirmationEmail,
} from "./email.service";

describe("email.service.ts - sendEmployeeCredentialsEmail", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
  });

  it("harus mensimulasikan email ke console log jika SMTP belum diatur", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await sendEmployeeCredentialsEmail({
      to: "pegawai.baru@gmail.com",
      fullName: "Budi Santoso",
      workEmail: "budi.santoso@pspk.id",
      temporaryPassword: "TempPassword123!",
      roleName: "Staf",
    });

    expect(result.success).toBe(true);
    expect(result.simulated).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();

    const loggedOutput = consoleSpy.mock.calls.flat().join(" ");
    expect(loggedOutput).toContain("/login");
    expect(loggedOutput).not.toContain("/masuk");
  });

  it("harus menggunakan loginUrl kustom jika disediakan secara eksplisit", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const customUrl = "https://custom-portal.pspk.id/auth";
    const result = await sendEmployeeCredentialsEmail({
      to: "pegawai.baru@gmail.com",
      fullName: "Budi Santoso",
      workEmail: "budi.santoso@pspk.id",
      temporaryPassword: "TempPassword123!",
      roleName: "Staf",
      loginUrl: customUrl,
    });

    expect(result.success).toBe(true);
    const loggedOutput = consoleSpy.mock.calls.flat().join(" ");
    expect(loggedOutput).toContain(customUrl);
  });

  it("harus mensimulasikan email konfirmasi ganti password ke email pribadi jika SMTP belum diatur", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const result = await sendPasswordChangedConfirmationEmail({
      to: "pegawai.pribadi@gmail.com",
      fullName: "Budi Santoso",
      workEmail: "budi.santoso@pspk.id",
      changedAt: new Date("2026-10-28T10:00:00Z"),
    });

    expect(result.success).toBe(true);
    expect(result.simulated).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();

    const loggedOutput = consoleSpy.mock.calls.flat().join(" ");
    expect(loggedOutput).toContain("pegawai.pribadi@gmail.com");
    expect(loggedOutput).toContain("budi.santoso@pspk.id");
    expect(loggedOutput).toContain("SIMULASI PENGIRIMAN KONFIRMASI GANTI PASSWORD");
  });
});
