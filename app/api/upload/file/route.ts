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

  // Video/audio playback relies on Range requests to seek and to start
  // playing before the whole file downloads — pass it straight through to S3.
  const range = req.headers.get("range") || undefined;

  try {
    const command = new GetObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: key,
      Range: range,
    });

    const response = await minioClient.send(command);

    if (!response.Body) {
      return new NextResponse("File body is empty", { status: 404 });
    }

    const filename = key.split("/").pop() || "file";
    const headers = new Headers();
    if (response.ContentType) {
      headers.set("Content-Type", response.ContentType);
    }
    headers.set("Content-Disposition", `inline; filename="${filename}"`);
    headers.set("Accept-Ranges", "bytes");

    // Stream the body straight through instead of buffering the whole
    // object into memory — required for large video files to work at all.
    const bodyStream = response.Body.transformToWebStream();

    if (range && response.ContentRange) {
      if (response.ContentLength !== undefined) {
        headers.set("Content-Length", response.ContentLength.toString());
      }
      headers.set("Content-Range", response.ContentRange);
      return new NextResponse(bodyStream, { status: 206, headers });
    }

    if (response.ContentLength) {
      headers.set("Content-Length", response.ContentLength.toString());
    }
    return new NextResponse(bodyStream, { status: 200, headers });
  } catch (err) {
    console.error("Failed to download file from S3:", err);
    return new NextResponse("File not found or failed to fetch from storage", { status: 404 });
  }
}
