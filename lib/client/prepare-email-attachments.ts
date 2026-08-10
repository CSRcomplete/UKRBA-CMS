import { uploadEmailAttachment, type UploadedAttachment } from "./upload-email-attachment";
import { createSharedDownloadLink } from "@/actions/emails/create-shared-download-link";

// Files above this size are sent as a download link instead of a raw
// attachment — base64 MIME encoding inflates size by ~37%, and mail
// providers (e.g. Hostinger) reject messages past their own size limit
// well before that inflated size reaches typical attachment limits.
export const LINK_THRESHOLD_BYTES = 20 * 1024 * 1024;

export type LinkedFile = { filename: string; size: number; url: string };

type Prepared = {
  attachmentPayload: UploadedAttachment[];
  linkedFiles: LinkedFile[];
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatSize(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Uploads the given files, splitting them into ones small enough to send as
 * real email attachments and ones large enough that they're uploaded to
 * storage instead and turned into a plain download link.
 */
export async function prepareEmailAttachments(files: File[]): Promise<Prepared> {
  const small = files.filter((f) => f.size <= LINK_THRESHOLD_BYTES);
  const large = files.filter((f) => f.size > LINK_THRESHOLD_BYTES);

  const attachmentPayload = await Promise.all(small.map((file) => uploadEmailAttachment(file)));

  const linkedFiles: LinkedFile[] = [];
  for (const file of large) {
    const uploaded = await uploadEmailAttachment(file);
    const result = await createSharedDownloadLink(uploaded);
    if ("error" in result) {
      throw new Error(result.error);
    }
    linkedFiles.push({ filename: uploaded.filename, size: uploaded.size, url: result.url });
  }

  return { attachmentPayload, linkedFiles };
}

export function appendDownloadLinksToBody(body: string, linkedFiles: LinkedFile[]): string {
  if (linkedFiles.length === 0) return body;
  const items = linkedFiles
    .map((f) => `<div>📎 <a href="${f.url}">${escapeHtml(f.filename)}</a> (${formatSize(f.size)})</div>`)
    .join("");
  return `${body}<div><br></div>${items}`;
}
