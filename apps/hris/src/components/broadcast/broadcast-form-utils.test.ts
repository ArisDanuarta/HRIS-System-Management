import { describe, it, expect } from "vitest";
import {
  getReplyToDisplayLabel,
  isBulkBroadcast,
  extractContentSummary,
  BULK_CONFIRM_THRESHOLD,
} from "./broadcast-form-utils";

describe("broadcast-form-utils.ts", () => {
  describe("getReplyToDisplayLabel", () => {
    it("harus mengembalikan label ramah pengguna untuk setiap mode reply-to", () => {
      expect(getReplyToDisplayLabel("NO_REPLY")).toBe("tanpa balasan");
      expect(getReplyToDisplayLabel("ORGANIZATION_HR")).toBe("balasan ke hr@pspk.id");
      expect(getReplyToDisplayLabel("SENDER_PERSONAL")).toBe("balasan ke email Anda");
      expect(getReplyToDisplayLabel("CUSTOM", "panitia@pspk.id")).toBe("balasan ke panitia@pspk.id");
      expect(getReplyToDisplayLabel("CUSTOM", "")).toBe("balasan ke alamat kustom");
    });
  });

  describe("isBulkBroadcast", () => {
    it("harus true jika targetScope adalah ALL_EMPLOYEES berapa pun jumlah penerima", () => {
      expect(isBulkBroadcast("ALL_EMPLOYEES", 5)).toBe(true);
      expect(isBulkBroadcast("ALL_EMPLOYEES", 100)).toBe(true);
    });

    it(`harus true jika jumlah penerima >= ${BULK_CONFIRM_THRESHOLD} meskipun bukan ALL_EMPLOYEES`, () => {
      expect(isBulkBroadcast("DEPARTMENT", BULK_CONFIRM_THRESHOLD)).toBe(true);
      expect(isBulkBroadcast("CUSTOM", BULK_CONFIRM_THRESHOLD + 5)).toBe(true);
    });

    it(`harus false jika bukan ALL_EMPLOYEES dan penerima < ${BULK_CONFIRM_THRESHOLD}`, () => {
      expect(isBulkBroadcast("TEAM", 8)).toBe(false);
      expect(isBulkBroadcast("DEPARTMENT", 19)).toBe(false);
      expect(isBulkBroadcast("CUSTOM", 1)).toBe(false);
    });
  });

  describe("extractContentSummary", () => {
    it("harus mengekstrak teks polos dan memotong pada 280 karakter", () => {
      const longText = "A".repeat(300);
      const html = `<h2>Judul Pengumuman</h2><p>${longText}</p>`;
      const summary = extractContentSummary(html);

      expect(summary.snippet.length).toBeLessThanOrEqual(280);
      expect(summary.snippet.endsWith("...")).toBe(true);
      expect(summary.snippet).toContain("Judul Pengumuman");
      expect(summary.imageCount).toBe(0);
    });

    it("harus menghitung jumlah gambar yang disematkan dalam HTML", () => {
      const html = `
        <p>Lihat bagan berikut:</p>
        <img src="/api/documents/broadcast-images/img-1.png" alt="Bagan 1" />
        <p>Dan denah lokasi:</p>
        <img src="/api/documents/broadcast-images/img-2.png" alt="Denah" />
      `;
      const summary = extractContentSummary(html);

      expect(summary.snippet).toContain("Lihat bagan berikut:");
      expect(summary.snippet).toContain("Dan denah lokasi:");
      expect(summary.imageCount).toBe(2);
    });

    it("harus menangani input HTML kosong dengan aman", () => {
      expect(extractContentSummary("")).toEqual({ snippet: "", imageCount: 0 });
      expect(extractContentSummary("   ")).toEqual({ snippet: "", imageCount: 0 });
    });
  });
});
