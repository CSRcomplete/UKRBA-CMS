"use server";

import crypto from "crypto";
import { prismadb } from "@/lib/prisma";
import { requireAuthenticated } from "@/lib/authz";

const LINK_EXPIRY_DAYS = 30;

type Input = {
  filename: string;
  contentType: string;
  size: number;
  storageKey: string;
};

/**
 * Creates a public, tokenized download link for a file already uploaded to
 * storage, for use in place of a raw email attachment when the file is too
 * large to send inline. The resulting URL points at /api/dl/[token], which
 * serves the file directly with no login and no CRM page — clicking it just
 * downloads the file, since the recipient is often an external contact with
 * no CRM account.
 */
export async function createSharedDownloadLink(input: Input) {
  let user;
  try {
    user = await requireAuthenticated();
  } catch {
    return { error: "Unauthorized" };
  }

  if (!input.storageKey || !input.filename) {
    return { error: "Missing file details" };
  }

  const token = crypto.randomBytes(24).toString("base64url");

  await prismadb.sharedFileLink.create({
    data: {
      token,
      storageKey: input.storageKey,
      filename: input.filename,
      contentType: input.contentType || "application/octet-stream",
      size: input.size,
      createdById: user.id,
      expiresAt: new Date(Date.now() + LINK_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  const baseUrl = (process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://crm.ukrba.org").replace(/\/$/, "");

  return { url: `${baseUrl}/api/dl/${token}` };
}
