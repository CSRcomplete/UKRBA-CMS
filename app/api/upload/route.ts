import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { PutObjectCommand, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { minioClient, MINIO_BUCKET, MINIO_PUBLIC_URL } from "@/lib/minio";
import { randomUUID } from "crypto";

export const maxDuration = 300;

const ALLOWED_FOLDERS = ["avatars", "images", "documents", "uploads"] as const;
type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-matroska",
]);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawFolder = formData.get("folder") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const filename = path.basename(file.name ?? "");
    const contentType = file.type;
    const folder: AllowedFolder = ALLOWED_FOLDERS.includes(rawFolder as AllowedFolder)
      ? (rawFolder as AllowedFolder)
      : "uploads";

    if (!filename || !contentType) {
      return NextResponse.json({ error: "filename and contentType are required" }, { status: 400 });
    }

    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return NextResponse.json({ error: "Content type not allowed" }, { status: 400 });
    }

    // Fall back to "bin" if filename has no extension or extension is empty (e.g., ".")
    const ext = filename.includes(".") ? filename.split(".").pop()?.trim() || "bin" : "bin";
    const key = `${folder}/${randomUUID()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Auto-create bucket if it doesn't exist
    try {
      await minioClient.send(new HeadBucketCommand({ Bucket: MINIO_BUCKET }));
    } catch (err: any) {
      const isNotFound = 
        err.name === "NotFound" || 
        err.name === "NoSuchBucket" || 
        err.$metadata?.httpStatusCode === 404;
        
      if (isNotFound) {
        console.log(`Bucket ${MINIO_BUCKET} not found. Automatically creating...`);
        await minioClient.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }));
      } else {
        throw err;
      }
    }

    const command = new PutObjectCommand({
      Bucket: MINIO_BUCKET,
      Key: key,
      ContentType: contentType,
      Body: buffer,
    });

    await minioClient.send(command);

    // The public URL where the file will be accessible after upload
    const fileUrl = `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${key}`;

    return NextResponse.json({ fileUrl, key });
  } catch (err) {
    console.error("Failed to upload file:", err);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
