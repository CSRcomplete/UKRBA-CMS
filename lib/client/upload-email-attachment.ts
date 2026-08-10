export interface UploadedAttachment {
  filename: string;
  contentType: string;
  size: number;
  storageKey: string;
}

/**
 * Uploads a file directly to storage via a presigned URL and returns a
 * reference to it, rather than reading it into a base64 string to send
 * inline — Cloudflare rejects request bodies much above ~1MB, so a base64
 * attachment (33% larger than the original file) fails for anything but
 * tiny files.
 */
export async function uploadEmailAttachment(file: File): Promise<UploadedAttachment> {
  const presignRes = await fetch("/api/upload/presigned-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      folder: "uploads",
    }),
  });

  if (!presignRes.ok) {
    const errJson = await presignRes.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to prepare upload for "${file.name}"`);
  }

  const { presignedUrl, key } = await presignRes.json();

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload of "${file.name}" was rejected by storage (status ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error(`Network error uploading "${file.name}"`));
    xhr.send(file);
  });

  return {
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    size: file.size,
    storageKey: key,
  };
}
