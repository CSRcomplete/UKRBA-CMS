import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { PutObjectCommand, HeadBucketCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { minioClient, minioPublicClient, MINIO_BUCKET, MINIO_PUBLIC_URL } from "@/lib/minio";
import { randomUUID } from "crypto";

const ALLOWED_FOLDERS = ["avatars", "images", "documents", "uploads"] as const;
type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { filename: rawFilename, contentType, folder: rawFolder = "uploads" } = await req.json();

  // Sanitize: strip any path components to prevent path traversal
  const filename = path.basename(rawFilename ?? "");
  // Whitelist folder to only allow known upload destinations
  const folder: AllowedFolder = ALLOWED_FOLDERS.includes(rawFolder as AllowedFolder)
    ? (rawFolder as AllowedFolder)
    : "uploads";

  if (!filename) {
    return NextResponse.json({ error: "filename is required" }, { status: 400 });
  }

  const effectiveContentType = contentType || "application/octet-stream";

  // Fall back to "bin" if filename has no extension or extension is empty (e.g., ".")
  const ext = filename.includes(".") ? filename.split(".").pop()?.trim() || "bin" : "bin";
  const key = `${folder}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: MINIO_BUCKET,
    Key: key,
    ContentType: effectiveContentType,
  });

  // Presigned URL valid for 10 minutes
  try {
    // Auto-create bucket if it doesn't exist
    try {
      await minioClient.send(new HeadBucketCommand({ Bucket: MINIO_BUCKET }));
    } catch (err: any) {
      const isNotFound =
        err.name === "NotFound" ||
        err.name === "NoSuchBucket" ||
        err.$metadata?.httpStatusCode === 404;

      if (isNotFound) {
        await minioClient.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }));
      }
    }

    const presignedUrl = await getSignedUrl(minioPublicClient, command, { expiresIn: 600 });

    // The public URL where the file will be accessible after upload
    const fileUrl = `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${key}`;

    return NextResponse.json({ presignedUrl, fileUrl, key });
  } catch (err) {
    console.error("Failed to generate presigned URL:", err);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
