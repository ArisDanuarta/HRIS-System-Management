import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { getSession } from "@pspk/auth";
import { getStorageProvider } from "@pspk/storage";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const reqHeaders = await headers();
    const session = await getSession(reqHeaders);

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const resolvedParams = await params;
    const key = (resolvedParams.path || []).join("/");

    if (!key) {
      return new Response("Invalid file path", { status: 400 });
    }

    const storage = getStorageProvider();
    const exists = await storage.exists(key);
    if (!exists) {
      return new Response("File not found", { status: 404 });
    }

    const file = await storage.get(key);

    // Convert node Readable to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        file.stream.on("data", (chunk) => controller.enqueue(chunk));
        file.stream.on("end", () => controller.close());
        file.stream.on("error", (err) => controller.error(err));
      },
    });

    const lowerKey = key.toLowerCase();
    let contentType = file.contentType;
    if (!contentType) {
      if (lowerKey.endsWith(".pdf")) contentType = "application/pdf";
      else if (lowerKey.endsWith(".png")) contentType = "image/png";
      else if (lowerKey.endsWith(".jpg") || lowerKey.endsWith(".jpeg")) contentType = "image/jpeg";
      else if (lowerKey.endsWith(".webp")) contentType = "image/webp";
      else contentType = "application/octet-stream";
    }

    return new Response(webStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(file.size),
        "Content-Disposition": `inline; filename="${key.split("/").pop()}"`,
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/documents error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
