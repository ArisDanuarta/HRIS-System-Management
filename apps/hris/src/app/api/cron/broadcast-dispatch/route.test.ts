import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

vi.mock("@pspk/db", () => ({
  prisma: {
    emailBroadcast: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/server/services/broadcast-email.service", () => ({
  processBroadcast: vi.fn(),
}));

import { prisma } from "@pspk/db";
import { processBroadcast } from "@/server/services/broadcast-email.service";

describe("POST /api/cron/broadcast-dispatch", () => {
  const originalEnv = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "super-secret-cron-token";
  });

  afterAll(() => {
    process.env.CRON_SECRET = originalEnv;
  });

  it("harus mengembalikan status 500 jika CRON_SECRET tidak dikonfigurasi di server", async () => {
    delete process.env.CRON_SECRET;

    const req = new NextRequest("http://localhost:3001/api/cron/broadcast-dispatch", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("CRON_SECRET belum dikonfigurasi");
  });

  it("harus mengembalikan status 401 jika header Authorization tidak ada atau tidak valid", async () => {
    const req1 = new NextRequest("http://localhost:3001/api/cron/broadcast-dispatch", {
      method: "POST",
    });
    const res1 = await POST(req1);
    expect(res1.status).toBe(401);

    const req2 = new NextRequest("http://localhost:3001/api/cron/broadcast-dispatch", {
      method: "POST",
      headers: { authorization: "Bearer invalid-token" },
    });
    const res2 = await POST(req2);
    expect(res2.status).toBe(401);
  });

  it("harus memproses kandidat broadcast yang masuk antrean dan mengembalikan status 200", async () => {
    vi.mocked(prisma.emailBroadcast.findMany).mockResolvedValueOnce([
      { id: "bc-1", subject: "Pengumuman 1", status: "QUEUED" },
      { id: "bc-2", subject: "Pengumuman 2", status: "SENDING" },
    ] as never);

    vi.mocked(processBroadcast)
      .mockResolvedValueOnce({
        processed: true,
        broadcastId: "bc-1",
        totalRecipients: 10,
        sentCount: 10,
        failedCount: 0,
        finalStatus: "SENT",
      })
      .mockResolvedValueOnce({
        processed: true,
        broadcastId: "bc-2",
        totalRecipients: 5,
        sentCount: 5,
        failedCount: 0,
        finalStatus: "SENT",
      });

    const req = new NextRequest("http://localhost:3001/api/cron/broadcast-dispatch", {
      method: "POST",
      headers: { authorization: "Bearer super-secret-cron-token" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.processedCandidates).toBe(2);
    expect(processBroadcast).toHaveBeenCalledWith("bc-1");
    expect(processBroadcast).toHaveBeenCalledWith("bc-2");
  });
});
