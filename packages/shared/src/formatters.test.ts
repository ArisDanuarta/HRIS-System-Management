import { describe, it, expect } from "vitest";
import { formatRupiah, formatDate, formatRelativeTime } from "./formatters";

describe("formatRupiah", () => {
  it("formats positive numbers correctly", () => {
    const formatted = formatRupiah(8500000);
    expect(formatted).toMatch(/Rp\s*8\.500\.000/);
  });

  it("handles 0, null, and undefined safely", () => {
    expect(formatRupiah(0)).toMatch(/Rp\s*0/);
    expect(formatRupiah(null)).toBe("Rp 0");
    expect(formatRupiah(undefined)).toBe("Rp 0");
    expect(formatRupiah("")).toBe("Rp 0");
  });
});

describe("formatDate", () => {
  it("formats Date object with Indonesian month names", () => {
    const date = new Date("2026-09-21T00:00:00Z");
    const formatted = formatDate(date);
    expect(formatted).toContain("2026");
    expect(formatted).toMatch(/September|Sep/i);
  });

  it("returns '-' for null or invalid date", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
    expect(formatDate("invalid-date")).toBe("-");
  });
});

describe("formatRelativeTime", () => {
  it("formats just now correctly", () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe("Baru saja");
  });

  it("formats minutes ago correctly", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinutesAgo)).toBe("5 menit lalu");
  });

  it("formats hours ago correctly", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(twoHoursAgo)).toBe("2 jam lalu");
  });

  it("handles null and invalid dates safely", () => {
    expect(formatRelativeTime(null)).toBe("-");
    expect(formatRelativeTime(undefined)).toBe("-");
    expect(formatRelativeTime("invalid")).toBe("-");
  });
});

describe("Timezone Utilities", () => {
  it("resolves timezone abbreviations correctly for Indonesia", async () => {
    const { getTimezoneAbbr, getTimezoneLabel } = await import("./formatters");
    expect(getTimezoneAbbr("Asia/Jakarta")).toBe("WIB");
    expect(getTimezoneAbbr("Asia/Makassar")).toBe("WITA");
    expect(getTimezoneAbbr("Asia/Jayapura")).toBe("WIT");

    expect(getTimezoneLabel("Asia/Jakarta")).toContain("WIB");
    expect(getTimezoneLabel("Asia/Makassar")).toContain("WITA");
    expect(getTimezoneLabel("Asia/Jayapura")).toContain("WIT");
  });

  it("formats date in target timezone accurately without UTC date shift", async () => {
    const { toDateStringInTimezone, formatTimeInZone } = await import("./formatters");
    // 2026-09-28 06:30:00 WIB is 2026-09-27 23:30:00Z in UTC
    const date = new Date("2026-09-27T23:30:00.000Z");

    // In Asia/Jakarta (UTC+7), it is 2026-09-28 06:30
    expect(toDateStringInTimezone(date, "Asia/Jakarta")).toBe("2026-09-28");
    expect(formatTimeInZone(date, "Asia/Jakarta")).toBe("06.30");

    // In Asia/Makassar (UTC+8), it is 2026-09-28 07:30
    expect(toDateStringInTimezone(date, "Asia/Makassar")).toBe("2026-09-28");
    expect(formatTimeInZone(date, "Asia/Makassar")).toBe("07.30");
  });

  it("converts work schedule between timezones correctly", async () => {
    const { convertTimeStringZone } = await import("./formatters");
    // 09:00 WIB (Asia/Jakarta, UTC+7) -> 10:00 WITA (Asia/Makassar, UTC+8)
    expect(convertTimeStringZone("09:00", "Asia/Jakarta", "Asia/Makassar")).toBe("10:00");
    // 17:00 WIB -> 18:00 WITA
    expect(convertTimeStringZone("17:00", "Asia/Jakarta", "Asia/Makassar")).toBe("18:00");
    // 09:15 WIB -> 10:15 WITA
    expect(convertTimeStringZone("09:15", "Asia/Jakarta", "Asia/Makassar")).toBe("10:15");

    // 09:00 WIB -> 11:00 WIT (Asia/Jayapura, UTC+9)
    expect(convertTimeStringZone("09:00", "Asia/Jakarta", "Asia/Jayapura")).toBe("11:00");

    // Same zone returns identical string
    expect(convertTimeStringZone("09:00", "Asia/Jakarta", "Asia/Jakarta")).toBe("09:00");
  });
});


