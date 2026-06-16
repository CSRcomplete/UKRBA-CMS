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
});

export const MINIO_BUCKET = bucket;
export const MINIO_PUBLIC_URL = process.env.NEXT_PUBLIC_MINIO_ENDPOINT || endpoint;
