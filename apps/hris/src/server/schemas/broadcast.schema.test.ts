import { describe, it, expect } from "vitest";
import {
  sendBroadcastSchema,
  senderPersonaSchema,
  replyToModeSchema,
} from "./broadcast.schema";

describe("broadcast.schema.ts - Validasi Skema Broadcast", () => {
  it("harus memiliki opsi persona dan reply-to yang terdefinisi dengan tepat", () => {
    expect(senderPersonaSchema.options).toEqual([
      "ORGANIZATION",
      "HR_TEAM",
      "PERSONAL",
      "CUSTOM",
    ]);
    expect(replyToModeSchema.options).toEqual([
      "NO_REPLY",
      "ORGANIZATION_HR",
      "SENDER_PERSONAL",
      "CUSTOM",
    ]);
  });

  it("harus mengisi nilai default untuk senderPersona dan replyToMode jika tidak disediakan", () => {
    const input = {
      subject: "Pengumuman Awal Tahun 2026",
      contentHtml: "<p>Selamat Tahun Baru untuk seluruh rekan PSPK!</p>",
      targetScope: "ALL_EMPLOYEES" as const,
    };

    const parsed = sendBroadcastSchema.parse(input);

    expect(parsed.senderPersona).toBe("ORGANIZATION");
    expect(parsed.replyToMode).toBe("NO_REPLY");
    expect(parsed.targetScope).toBe("ALL_EMPLOYEES");
    expect(parsed.sendInApp).toBe(true);
    expect(parsed.customEmployeeIds).toEqual([]);
  });

  it("harus menerima persona valid: HR_TEAM, PERSONAL, CUSTOM", () => {
    const hrInput = {
      subject: "Informasi Payroll Bulan Ini",
      contentHtml: "<p>Slip gaji telah dapat diakses di portal HRIS.</p>",
      senderPersona: "HR_TEAM" as const,
      replyToMode: "ORGANIZATION_HR" as const,
    };

    const parsedHr = sendBroadcastSchema.parse(hrInput);
    expect(parsedHr.senderPersona).toBe("HR_TEAM");
    expect(parsedHr.replyToMode).toBe("ORGANIZATION_HR");

    const customInput = {
      subject: "Rapat Kerja Tahunan PSPK 2026",
      contentHtml: "<p>Agenda dan rundown terlampir di bawah ini.</p>",
      senderPersona: "CUSTOM" as const,
      customSenderName: "Panitia Raker PSPK",
      replyToMode: "CUSTOM" as const,
      customReplyToEmail: "raker@pspk.id",
    };

    const parsedCustom = sendBroadcastSchema.parse(customInput);
    expect(parsedCustom.senderPersona).toBe("CUSTOM");
    expect(parsedCustom.customSenderName).toBe("Panitia Raker PSPK");
    expect(parsedCustom.replyToMode).toBe("CUSTOM");
    expect(parsedCustom.customReplyToEmail).toBe("raker@pspk.id");
  });

  it("harus menolak format email kustom yang tidak valid", () => {
    const invalidEmailInput = {
      subject: "Undangan Sosialisasi Internal",
      contentHtml: "<p>Silakan hadir pada pertemuan hari Senin.</p>",
      replyToMode: "CUSTOM" as const,
      customReplyToEmail: "bukan-alamat-email-valid",
    };

    expect(() => sendBroadcastSchema.parse(invalidEmailInput)).toThrow(
      "Format alamat email balasan kustom tidak valid.",
    );
  });

  it("harus menolak customSenderName yang melebihi 100 karakter", () => {
    const longName = "A".repeat(101);
    const input = {
      subject: "Pengumuman Khusus",
      contentHtml: "<p>Isi pengumuman yang cukup panjang dan informatif.</p>",
      customSenderName: longName,
    };

    expect(() => sendBroadcastSchema.parse(input)).toThrow(
      "Nama pengirim kustom maksimal 100 karakter.",
    );
  });
});
