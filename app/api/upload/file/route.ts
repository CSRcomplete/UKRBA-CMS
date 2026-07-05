import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { minioClient, MINIO_BUCKET } from "@/lib/minio";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const key = searchParams.get("key");

  if (!key) {
    return new NextResponse("Missing key parameter", { status: 400 });
  }

  try {
    const command = new GetObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: key,
    });

    const response = await minioClient.send(command);

    if (!response.Body) {
      return new NextResponse("File body is empty", { status: 404 });
    }

    // Convert readable stream to Uint8Array/Buffer
    const bytes = await response.Body.transformToByteArray();

    const headers = new Headers();
    if (response.ContentType) {
      headers.set("Content-Type", response.ContentType);
    }
    if (response.ContentLength) {
      headers.set("Content-Length", response.ContentLength.toString());
    }

    // Force inline preview for images/PDFs/videos, download for others
    const filename = key.split("/").pop() || "file";
    headers.set("Content-Disposition", `inline; filename="${filename}"`);

    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers,
    });
  } catch (err) {
    console.error("Failed to download file from S3:", err);
    return new NextResponse("File not found or failed to fetch from storage", { status: 404 });
  }
}
