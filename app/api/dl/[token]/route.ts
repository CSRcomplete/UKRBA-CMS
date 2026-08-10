import { NextRequest, NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { minioClient, MINIO_BUCKET } from "@/lib/minio";
import { prismadb } from "@/lib/prisma";

// Public download endpoint — intentionally no auth check. Recipients of a
// shared-file-link email are often external contacts with no CRM account,
// so this route must serve the raw file directly with no sign-in and no
// CRM page in between; clicking the link just starts a download.
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const link = await prismadb.sharedFileLink.findUnique({ where: { token } });

  if (!link) {
    return new NextResponse("This link is invalid.", { status: 404 });
  }
  if (link.expiresAt && link.expiresAt < new Date()) {
    return new NextResponse("This link has expired.", { status: 410 });
  }

  try {
    const command = new GetObjectCommand({ Bucket: MINIO_BUCKET, Key: link.storageKey });
    const response = await minioClient.send(command);

    if (!response.Body) {
      return new NextResponse("File not found.", { status: 404 });
    }

    prismadb.sharedFileLink
      .update({ where: { id: link.id }, data: { downloadCount: { increment: 1 } } })
      .catch(() => {});

    const asciiFallback = link.filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
    const encoded = encodeURIComponent(link.filename);

    const headers = new Headers();
    headers.set("Content-Type", link.contentType || "application/octet-stream");
    headers.set("Content-Disposition", `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`);
    if (response.ContentLength) {
      headers.set("Content-Length", response.ContentLength.toString());
    }

    const bodyStream = response.Body.transformToWebStream();
    return new NextResponse(bodyStream, { status: 200, headers });
  } catch (err) {
    console.error("Failed to stream shared file download:", err);
    return new NextResponse("Failed to download file.", { status: 500 });
  }
}
