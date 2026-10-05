import { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.MINIO_ENDPOINT || "http://localhost:9000";
const accessKey = process.env.MINIO_ACCESS_KEY || "minio_placeholder";
const secretKey = process.env.MINIO_SECRET_KEY || "minio_placeholder";
const bucket = process.env.MINIO_BUCKET || "nextcrm";

export const minioClient = new S3Client({
  endpoint: endpoint,
  region: "us-east-1", // MinIO requires a region value; actual value doesn't matter
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  forcePathStyle: true, // REQUIRED for MinIO — without this, SDK uses virtual-hosted-style which breaks
  // AWS SDK v3 defaults to auto-adding a checksum header/trailer to PutObject
  // requests, which this MinIO version signs/validates incorrectly and
  // rejects with "SignatureDoesNotMatch". Presigned-URL uploads elsewhere
  // dodge this (the browser does the raw PUT itself, outside the SDK's
  // request pipeline) — direct server-side PutObjectCommand calls don't.
  requestChecksumCalculation: "WHEN_REQUIRED",
});

export const MINIO_BUCKET = bucket;
export const MINIO_PUBLIC_URL = process.env.NEXT_PUBLIC_MINIO_ENDPOINT || process.env.MINIO_PUBLIC_ENDPOINT || endpoint;

const publicEndpoint = process.env.NEXT_PUBLIC_MINIO_ENDPOINT || process.env.MINIO_PUBLIC_ENDPOINT || endpoint;

export const minioPublicClient = new S3Client({
  endpoint: publicEndpoint,
  region: "us-east-1",
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
  forcePathStyle: true,
  requestChecksumCalculation: "WHEN_REQUIRED",
});
