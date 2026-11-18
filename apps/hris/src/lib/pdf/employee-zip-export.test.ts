import { describe, it, expect, vi } from "vitest";
import { Readable } from "node:stream";
import { createEmployeeProfileZip, streamToBuffer } from "./employee-zip-export";

describe("employee-zip-export", () => {
  it("streamToBuffer should properly convert Readable stream into a Buffer", async () => {
    const readable = Readable.from(["Halo ", "Dunia ", "PSPK"]);
    const buffer = await streamToBuffer(readable);
    expect(buffer.toString("utf-8")).toBe("Halo Dunia PSPK");
  });

  it("createEmployeeProfileZip should generate valid zip buffer with PK header", async () => {
    const mockPdfBuffer = Buffer.from("%PDF-1.4 mock pdf content");
    const mockStorageProvider = {
      get: vi.fn().mockImplementation((key: string) => {
        if (key === "docs/ktp.pdf") {
          return Promise.resolve({
            stream: Readable.from(["mock KTP file content"]),
          });
        }
        if (key === "photos/john.jpg") {
          return Promise.resolve({
            stream: Readable.from(["mock photo bytes"]),
          });
        }
        return Promise.reject(new Error("File not found in vault"));
      }),
    };

    const zipBuffer = await createEmployeeProfileZip({
      employee: {
        id: "emp-001",
        employeeNo: "PSPK-001",
        fullName: "Budi Santoso",
        gender: "MALE",
        photoKey: "photos/john.jpg",
        documents: [
          {
            category: "IDENTITAS",
            fileName: "KTP_Budi.pdf",
            fileKey: "docs/ktp.pdf",
          },
          {
            category: "IJAZAH",
            fileName: "Ijazah_S1.pdf",
            fileKey: "docs/missing.pdf", // Menguji graceful error handling
          },
        ],
      },
      pdfBuffer: mockPdfBuffer,
      storageProvider: mockStorageProvider,
    });

    expect(Buffer.isBuffer(zipBuffer)).toBe(true);
    expect(zipBuffer.length).toBeGreaterThan(0);

    // Verifikasi Zip Magic Bytes: PK\x03\x04 (0x50, 0x4B, 0x03, 0x04)
    expect(zipBuffer[0]).toBe(0x50);
    expect(zipBuffer[1]).toBe(0x4b);
    expect(zipBuffer[2]).toBe(0x03);
    expect(zipBuffer[3]).toBe(0x04);
  });

  it("createEmployeeProfileZip should handle missing photo and documents gracefully", async () => {
    const mockPdfBuffer = Buffer.from("%PDF-1.4 minimal pdf");

    const zipBuffer = await createEmployeeProfileZip({
      employee: {
        id: "emp-002",
        employeeNo: "PSPK-002",
        fullName: "Siti Rahmawati",
        gender: "FEMALE",
        photoKey: null,
        documents: [],
      },
      pdfBuffer: mockPdfBuffer,
      storageProvider: undefined,
    });

    expect(Buffer.isBuffer(zipBuffer)).toBe(true);
    // Verifikasi magic bytes ZIP
    expect(zipBuffer[0]).toBe(0x50);
    expect(zipBuffer[1]).toBe(0x4b);
    expect(zipBuffer[2]).toBe(0x03);
    expect(zipBuffer[3]).toBe(0x04);
  });
});
