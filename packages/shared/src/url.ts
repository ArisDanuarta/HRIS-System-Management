export type PSPKAppKey = "hris" | "sysmgmt";

/**
 * Menghitung URL tujuan (HRIS atau System Management) secara dinamis & adaptif:
 *
 * 1. Di Browser (Client-side):
 *    - Jika hostname adalah localhost / 127.0.0.1:
 *        target 'hris'    -> http://localhost:3001
 *        target 'sysmgmt' -> http://localhost:3002
 *    - Jika di VPS / Domain Publik (misal: hris.moonrayz.my.id, sysmgmt.pspk.id, dll):
 *        Jika membuka subdomain 'hris.*' dan target 'sysmgmt' -> otomatis ganti ke 'sysmgmt.*'
 *        Jika membuka subdomain 'sysmgmt.*' dan target 'hris' -> otomatis ganti ke 'hris.*'
 *        Mengabaikan nilai default 'localhost' jika browser sedang berada di domain publik.
 *
 * 2. Di Server (SSR / Server Component):
 *    - Menggunakan explicitUrl jika diberikan (dan bukan localhost saat runtime production).
 *    - Menggunakan process.env.HRIS_URL atau process.env.SYSMGMT_URL.
 */
export function resolveAppUrl(targetApp: PSPKAppKey, explicitUrl?: string): string {
  // Skenario 1: Berjalan di Browser (Client-Side)
  const isBrowser = typeof globalThis !== "undefined" && "window" in globalThis;
  const win = isBrowser ? (globalThis as unknown as { window?: { location?: { protocol: string; hostname: string; port: string } } }).window : undefined;

  if (win && win.location) {
    const { protocol, hostname, port } = win.location;
    const isLocal =
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.endsWith(".local");

    if (isLocal) {
      // Jika di mesin lokal, hormati port lokal eksplisit jika ada
      if (explicitUrl && (explicitUrl.includes("localhost") || explicitUrl.includes("127.0.0.1"))) {
        return explicitUrl.replace(/\/+$/, "");
      }
      return targetApp === "hris" ? "http://localhost:3001" : "http://localhost:3002";
    }

    // Jika di Lingkungan VPS / Domain Publik:
    // Jika explicitUrl diberikan dan benar-benar domain publik valid (bukan fallback localhost)
    if (
      explicitUrl &&
      !explicitUrl.includes("localhost") &&
      !explicitUrl.includes("127.0.0.1") &&
      !explicitUrl.includes("0.0.0.0")
    ) {
      return explicitUrl.replace(/\/+$/, "");
    }

    // Resolusi cerdas subdomain swap (misal: hris.moonrayz.my.id <-> sysmgmt.moonrayz.my.id)
    const portSuffix = port && port !== "80" && port !== "443" ? `:${port}` : "";

    if (targetApp === "sysmgmt") {
      if (hostname.startsWith("hris.")) {
        return `${protocol}//${hostname.replace(/^hris\./, "sysmgmt.")}${portSuffix}`;
      }
      if (hostname.includes("hris")) {
        return `${protocol}//${hostname.replace("hris", "sysmgmt")}${portSuffix}`;
      }
    } else if (targetApp === "hris") {
      if (hostname.startsWith("sysmgmt.")) {
        return `${protocol}//${hostname.replace(/^sysmgmt\./, "hris.")}${portSuffix}`;
      }
      if (hostname.includes("sysmgmt")) {
        return `${protocol}//${hostname.replace("sysmgmt", "hris")}${portSuffix}`;
      }
    }

    // Fallback domain publik jika subdomain tidak berpola hris/sysmgmt
    return `${protocol}//${hostname}${portSuffix}`;
  }

  // Skenario 2: Berjalan di Server (SSR / Server Component)
  if (explicitUrl && explicitUrl.trim() !== "") {
    return explicitUrl.replace(/\/+$/, "");
  }

  if (targetApp === "hris") {
    return process.env.HRIS_URL || process.env.NEXT_PUBLIC_HRIS_URL || "http://localhost:3001";
  }

  return process.env.SYSMGMT_URL || process.env.NEXT_PUBLIC_SYSMGMT_URL || "http://localhost:3002";
}
