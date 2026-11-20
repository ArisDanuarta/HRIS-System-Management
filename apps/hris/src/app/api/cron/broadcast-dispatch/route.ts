import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@pspk/db";
import { processBroadcast } from "@/server/services/broadcast-email.service";

export const dynamic = "force-dynamic";

/**
 * Route handler cron untuk memproses antrean email broadcast yang tertunda (QUEUED)
 * atau yang mengalami lease timeout saat worker sebelumnya crash (hung lease).
 *
 * Dilindungi header: Authorization: Bearer ${CRON_SECRET}
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET belum dikonfigurasi di server." },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get("authorization");
  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Akses ditolak: Secret cron tidak valid atau tidak disertakan." },
      { status: 401 },
    );
  }

  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Ambil daftar broadcast yang perlu diproses
    const candidateBroadcasts = await prisma.emailBroadcast.findMany({
      where: {
        OR: [
          { status: "QUEUED" },
          {
            status: "SENDING",
            OR: [{ lockedAt: null }, { lockedAt: { lt: fiveMinutesAgo } }],
          },
        ],
      },
      select: { id: true, subject: true, status: true },
      take: 10,
      orderBy: { createdAt: "asc" },
    });

    const results = [];
    for (const b of candidateBroadcasts) {
      try {
        const processResult = await processBroadcast(b.id);
        results.push({
          id: b.id,
          subject: b.subject,
          result: processResult,
        });
      } catch (err: unknown) {
        console.error(`Gagal memproses broadcast id ${b.id} pada cron:`, err);
        results.push({
          id: b.id,
          subject: b.subject,
          error: err instanceof Error ? err.message : "Kesalahan prosesor",
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedCandidates: candidateBroadcasts.length,
      details: results,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("Gagal menjalankan cron broadcast-dispatch:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat memproses antrean broadcast." },
      { status: 500 },
    );
  }
}
