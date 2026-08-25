import { PutObjectCommand } from "@aws-sdk/client-s3";
import { minioClient, MINIO_BUCKET, MINIO_PUBLIC_URL } from "@/lib/minio";
import { randomUUID } from "crypto";
import { prismadb } from "@/lib/prisma";
import type { FetchedAttachment } from "@/inngest/lib/imap-utils";

/**
 * Uploads attachments parsed off an incoming IMAP message to storage and
 * records them against the given email. Shared by every code path that can
 * be the one to first fetch a message's body — the lazy fetch in
 * getEmail() and the eager fetch in the email/link-crm Inngest function —
 * since whichever one runs first is the only one that will ever see
 * body.attachments (bodyText/bodyHtml being already set is what gates
 * re-fetching).
 */
export async function storeFetchedAttachments(
  emailId: string,
  attachments: FetchedAttachment[] | undefined
) {
  if (!attachments || attachments.length === 0) return [];

  try {
    return await Promise.all(
      attachments.map(async (att) => {
        const ext = att.filename.includes(".") ? att.filename.split(".").pop()!.trim() || "bin" : "bin";
        const key = `uploads/${randomUUID()}.${ext}`;
        await minioClient.send(
          new PutObjectCommand({
            Bucket: MINIO_BUCKET,
            Key: key,
            ContentType: att.contentType || "application/octet-stream",
            ContentLength: att.content.length,
            Body: att.content,
          })
        );
        return prismadb.emailAttachment.create({
          data: {
            emailId,
            filename: att.filename,
            mimeType: att.contentType || "application/octet-stream",
            size: att.content.length,
            storageUrl: `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${key}`,
            contentId: att.contentId,
          },
        });
      })
    );
  } catch (err) {
    console.error("[EMAIL_ATTACHMENT_UPLOAD]", err);
    return [];
  }
}
