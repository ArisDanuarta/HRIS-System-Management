import { prisma } from "@pspk/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" });
  } catch (error) {
    console.error("Health check failed:", error);
    return Response.json({ status: "error" }, { status: 503 });
  }
}
