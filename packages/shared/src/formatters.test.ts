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

  it("formats time with custom options across different timezones", async () => {
    const { formatTimeInZone } = await import("./formatters");
    const d = new Date("2026-09-28T05:20:00.000Z"); // 05:20 UTC
    // WIB (UTC+7): 12:20:00
    // WITA (UTC+8): 13:20:00
    // WIT (UTC+9): 14:20:00
    const opt = { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false } as const;
    expect(formatTimeInZone(d, "Asia/Jakarta", opt)).toBe("12.20.00");
    expect(formatTimeInZone(d, "Asia/Makassar", opt)).toBe("13.20.00");
    expect(formatTimeInZone(d, "Asia/Jayapura", opt)).toBe("14.20.00");
  });

  it("calculates ISO timezone offsets properly", async () => {
    const { getTimezoneOffsetString } = await import("./formatters");
    expect(getTimezoneOffsetString("Asia/Jakarta")).toBe("+07:00");
    expect(getTimezoneOffsetString("Asia/Makassar")).toBe("+08:00");
    expect(getTimezoneOffsetString("Asia/Jayapura")).toBe("+09:00");
  });
});

describe("IP Address Utilities", () => {
  it("cleans IP addresses correctly from loopback, all-zeros, and ipv4-mapped formats", async () => {
    const { cleanIpAddress } = await import("./formatters");
    expect(cleanIpAddress("::1")).toBe("127.0.0.1");
    expect(cleanIpAddress("[::1]")).toBe("127.0.0.1");
    expect(cleanIpAddress("::")).toBe("127.0.0.1");
    expect(cleanIpAddress("0000:0000:0000:0000:0000:0000:0000:0000")).toBe("127.0.0.1");
    expect(cleanIpAddress("0000:0000:0000:0000:0000:0000:0000:0001")).toBe("127.0.0.1");
    expect(cleanIpAddress("localhost")).toBe("127.0.0.1");
    expect(cleanIpAddress("::ffff:192.168.1.42")).toBe("192.168.1.42");
    expect(cleanIpAddress("::ffff:127.0.0.1")).toBe("127.0.0.1");
    expect(cleanIpAddress("103.144.20.5")).toBe("103.144.20.5");
    expect(cleanIpAddress(null)).toBe("127.0.0.1");
    expect(cleanIpAddress(undefined)).toBe("127.0.0.1");
  });

  it("extracts client IP from proxy headers with correct precedence", async () => {
    const { extractClientIp } = await import("./formatters");
    // Cloudflare header has top priority
    const cfHeaders = new Headers({
      "cf-connecting-ip": "114.122.50.1",
      "x-forwarded-for": "172.18.0.1",
    });
    expect(extractClientIp(cfHeaders)).toBe("114.122.50.1");

    // X-Real-IP
    const realIpHeaders = new Headers({
      "x-real-ip": "103.20.10.4",
      "x-forwarded-for": "172.18.0.1",
    });
    expect(extractClientIp(realIpHeaders)).toBe("103.20.10.4");

    // Multi-hop x-forwarded-for: client IP is first hop
    const proxyChain = new Headers({
      "x-forwarded-for": "180.252.10.5, 172.18.0.1, 10.0.0.1",
    });
    expect(extractClientIp(proxyChain)).toBe("180.252.10.5");

    // Local dev Next.js ::1 in x-forwarded-for
    const localHeaders = new Headers({
      "x-forwarded-for": "::1",
    });
    expect(extractClientIp(localHeaders)).toBe("127.0.0.1");

    // Plain record headers
    expect(extractClientIp({ "x-real-ip": "103.20.10.4" })).toBe("103.20.10.4");
    expect(extractClientIp(null)).toBe("127.0.0.1");
  });

  it("formats IP address nicely for user interface", async () => {
    const { formatIpAddress } = await import("./formatters");
    expect(formatIpAddress("127.0.0.1")).toBe("127.0.0.1 (Lokal)");
    expect(formatIpAddress("::1")).toBe("127.0.0.1 (Lokal)");
    expect(formatIpAddress("0000:0000:0000:0000:0000:0000:0000:0000")).toBe("127.0.0.1 (Lokal)");
    expect(formatIpAddress("localhost")).toBe("127.0.0.1 (Lokal)");
    expect(formatIpAddress(null)).toBe("127.0.0.1 (Lokal)");
    expect(formatIpAddress("")).toBe("127.0.0.1 (Lokal)");

    // Private networks
    expect(formatIpAddress("192.168.1.100")).toBe("192.168.1.100 (Jaringan Privat)");
    expect(formatIpAddress("10.0.1.5")).toBe("10.0.1.5 (Jaringan Privat)");
    expect(formatIpAddress("172.20.1.5")).toBe("172.20.1.5 (Jaringan Privat)");

    // Public IP
    expect(formatIpAddress("203.0.113.195")).toBe("203.0.113.195");
  });
});

describe("angkaTerbilang", () => {
  it("converts basic numbers correctly", async () => {
    const { angkaTerbilang } = await import("./formatters");
    expect(angkaTerbilang(0)).toBe("Nol Rupiah");
    expect(angkaTerbilang(null)).toBe("Nol Rupiah");
    expect(angkaTerbilang(1)).toBe("Satu Rupiah");
    expect(angkaTerbilang(10)).toBe("Sepuluh Rupiah");
    expect(angkaTerbilang(11)).toBe("Sebelas Rupiah");
    expect(angkaTerbilang(15)).toBe("Lima Belas Rupiah");
    expect(angkaTerbilang(20)).toBe("Dua Puluh Rupiah");
    expect(angkaTerbilang(100)).toBe("Seratus Rupiah");
    expect(angkaTerbilang(1000)).toBe("Seribu Rupiah");
    expect(angkaTerbilang(1500)).toBe("Seribu Lima Ratus Rupiah");
    expect(angkaTerbilang(10000)).toBe("Sepuluh Ribu Rupiah");
  });

  it("converts realistic salary numbers correctly", async () => {
    const { angkaTerbilang } = await import("./formatters");
    expect(angkaTerbilang(14560000)).toBe(
      "Empat Belas Juta Lima Ratus Enam Puluh Ribu Rupiah",
    );
    expect(angkaTerbilang(8500000)).toBe("Delapan Juta Lima Ratus Ribu Rupiah");
    expect(angkaTerbilang(28000000)).toBe("Dua Puluh Delapan Juta Rupiah");
    expect(angkaTerbilang(37600000)).toBe(
      "Tiga Puluh Tujuh Juta Enam Ratus Ribu Rupiah",
    );
  });
});
