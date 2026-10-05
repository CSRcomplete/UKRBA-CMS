import { S3Client, HeadBucketCommand, CreateBucketCommand } from "@aws-sdk/client-s3";
import { minioClient, MINIO_BUCKET } from "../lib/minio";

async function main() {
  console.log(`Checking bucket: ${MINIO_BUCKET}`);
  try {
    await minioClient.send(new HeadBucketCommand({ Bucket: MINIO_BUCKET }));
    console.log("Bucket already exists!");
  } catch (err: any) {
    console.log("Error checking bucket:", err.name, err.message || err);
    if (err.name === "NotFound" || err.name === "NoSuchBucket" || err.$metadata?.httpStatusCode === 404) {
      console.log("Attempting to create bucket...");
      try {
        await minioClient.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }));
        console.log("Bucket created successfully!");
      } catch (createErr: any) {
        console.error("Failed to create bucket:", createErr.name, createErr.message || createErr);
      }
    }
  }
}

main().catch(console.error);
