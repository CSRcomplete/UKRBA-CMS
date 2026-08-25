"use server";
import { getSession } from "@/lib/auth-server";

import { prismadb } from "@/lib/prisma";
import { decrypt } from "@/lib/email-crypto";
import { serializeDecimals, serializeDecimalsList } from "@/lib/serialize-decimals";
import nodemailer from "nodemailer";
import { EmailFolder } from "@prisma/client";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { minioClient, MINIO_BUCKET, MINIO_PUBLIC_URL } from "@/lib/minio";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

// Embed the signature logo as a data URI rather than linking to it remotely —
// a remote <img src> depends on the recipient's mail client fetching it (many
// block remote images by default, and it renders as a broken box if blocked
// or if the app's own URL ever changes), so embedding the actual bytes makes
// the signature render reliably everywhere.
const UKRBA_LOGO_DATA_URI: string | undefined = (() => {
  try {
    const logoPath = path.join(process.cwd(), "public", "images", "ukrba-logo.png");
    const buffer = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return undefined;
  }
})();

const PAGE_SIZE = 50;
const MAX_COUNT = 10_000;

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  await requireSession();
  
  try {
    const dbTemplates = await prismadb.crm_campaign_templates.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, subject_default: true, content_html: true },
      take: 10,
    });
    
    if (dbTemplates.length > 0) {
      return dbTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        subject: t.subject_default || t.name,
        body: t.content_html,
      }));
    }
  } catch {
    // Fallback
  }

  return [
    {
      id: "ukrba-intro",
      name: "UKRBA Partnership Introduction",
      subject: "Introduction to UK SME Responsible Business Association",
      body: "Dear [Name],\n\nThank you for connecting with the UK SME Responsible Business Association (UKRBA). We specialize in supporting SMEs across the UK with compliance, responsible business frameworks, and growth.\n\nPlease let us know a convenient time for a brief introductory discussion.\n\nWarm regards,",
    },
    {
      id: "ukrba-followup",
      name: "Membership Inquiry Follow-up",
      subject: "Following up on your UKRBA Membership Inquiry",
      body: "Dear [Name],\n\nI am following up on your recent inquiry regarding UKRBA membership benefits for your business.\n\nWe would love to share details on how our association can support your organization's goals this year.\n\nKind regards,",
    },
    {
      id: "ukrba-reminder",
      name: "Invoice & Account Reminder",
      subject: "UKRBA Account Renewal & Invoice Reminder",
      body: "Dear [Name],\n\nThis is a friendly reminder regarding your pending UKRBA renewal invoice.\n\nIf you have any questions or require assistance with payment details, please reply directly to this email.\n\nThank you for your continued partnership,",
    },
  ];
}

export async function saveDraft(input: {
  accountId: string;
  draftId?: string;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
}) {
  const userId = await requireSession();

  if (input.draftId) {
    const existing = await prismadb.email.findFirst({
      where: { id: input.draftId, userId, folder: EmailFolder.DRAFTS },
    });
    if (existing) {
      return prismadb.email.update({
        where: { id: input.draftId },
        data: {
          subject: input.subject || "(Draft)",
          toRecipients: input.to?.map((e) => ({ email: e })) ?? [],
          ccRecipients: input.cc?.map((e) => ({ email: e })) ?? [],
          bccRecipients: input.bcc?.map((e) => ({ email: e })) ?? [],
          bodyText: input.body || "",
          bodyHtml: input.body || "",
          sentAt: new Date(),
        },
      });
    }
  }

  return prismadb.email.create({
    data: {
      emailAccountId: input.accountId,
      userId,
      rfcMessageId: `draft-${crypto.randomUUID()}@nextcrm`,
      folder: EmailFolder.DRAFTS,
      subject: input.subject || "(Draft)",
      fromEmail: "",
      toRecipients: input.to?.map((e) => ({ email: e })) ?? [],
      ccRecipients: input.cc?.map((e) => ({ email: e })) ?? [],
      bccRecipients: input.bcc?.map((e) => ({ email: e })) ?? [],
      bodyText: input.body || "",
      bodyHtml: input.body || "",
      sentAt: new Date(),
      isRead: true,
    },
  });
}

async function requireSession() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id as string;
}

export async function getEmails(
  accountId: string,
  folder: EmailFolder,
  page: number,
  search?: string
) {
  const userId = await requireSession();

  // Validate UUID format to prevent Postgres syntax error 22P02 on invalid string input
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountId);
  if (!isUuid) {
    return { emails: [], total: 0, page: 1, totalPages: 0 };
  }

  const baseWhere = {
    userId,
    emailAccountId: accountId,
    folder,
    isDeleted: false,
  } as const;

  try {
    // Build where clause with optional text search fallback
    const where =
      search && search.length >= 3
        ? {
            ...baseWhere,
            OR: [
              { subject: { contains: search, mode: "insensitive" as const } },
              { fromEmail: { contains: search, mode: "insensitive" as const } },
              { fromName: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : baseWhere;

    const [emails, rawCount] = await Promise.all([
      prismadb.email.findMany({
        where,
        orderBy: { sentAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          subject: true,
          fromName: true,
          fromEmail: true,
          toRecipients: true,
          bodyText: true,
          sentAt: true,
          isRead: true,
          folder: true,
        },
      }),
      prismadb.email.count({ where }),
    ]);

    const formattedEmails = emails.map((e) => ({
      ...e,
      toRecipients: (Array.isArray(e.toRecipients) ? e.toRecipients : []) as { name?: string; email: string }[],
    }));

    const total = Math.min(rawCount, MAX_COUNT);
    return { emails: serializeDecimalsList(formattedEmails), total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  } catch (err) {
    console.error("Error fetching emails:", err);
    return { emails: [], total: 0, page: 1, totalPages: 0 };
  }
}

export async function getEmail(id: string) {
  const userId = await requireSession();

  const email = await prismadb.email.findFirst({
    where: { id, userId, isDeleted: false },
    include: {
      contacts: { include: { contact: { select: { id: true, first_name: true, last_name: true } } } },
      accounts: { include: { account: { select: { id: true, name: true } } } },
      attachments: true,
    },
  });
  if (!email) throw new Error("Not found");

  // Lazy body fetch for emails not yet CRM-linked at sync time
  if (!email.bodyText && !email.bodyHtml && email.imapUid) {
    try {
      const account = await prismadb.emailAccount.findUnique({
        where: { id: email.emailAccountId },
        select: {
          username: true,
          passwordEncrypted: true,
          imapHost: true,
          imapPort: true,
          imapSsl: true,
          sentFolderName: true,
        },
      });

      if (account) {
        const { fetchBodyByMessageId, fetchBodyByUid } = await import("@/inngest/lib/imap-utils");
        const folderName = email.folder === "SENT" ? (account.sentFolderName || "Sent") : "INBOX";
        const creds = {
          username: account.username,
          password: decrypt(account.passwordEncrypted),
          imapHost: account.imapHost,
          imapPort: account.imapPort,
          imapSsl: account.imapSsl,
        };
        // Message-ID is stable even if the mailbox's UIDs get renumbered
        // server-side — falling back to the stored UID only when we have no
        // real Message-ID to search with (see imap-utils.ts).
        const isRealMessageId = !email.rfcMessageId.endsWith("-header@local");
        const body = isRealMessageId
          ? await fetchBodyByMessageId(creds, folderName, email.rfcMessageId)
          : await fetchBodyByUid(creds, folderName, email.imapUid);

        if (body.bodyText || body.bodyHtml) {
          await prismadb.email.update({
            where: { id },
            data: {
              bodyText: body.bodyText ?? null,
              bodyHtml: body.bodyHtml ?? null,
              inReplyTo: body.inReplyTo ?? undefined,
              references: body.references ?? undefined,
            },
          });
          // Patch in-memory so caller gets the body immediately (before any send that may throw)
          email.bodyText = body.bodyText ?? null;
          email.bodyHtml = body.bodyHtml ?? null;

          // Upload any real (non-inline) attachments to storage and record
          // them — inline images were already embedded into bodyHtml above.
          if (body.attachments && body.attachments.length > 0) {
            try {
              const createdAttachments = await Promise.all(
                body.attachments.map(async (att) => {
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
                      emailId: id,
                      filename: att.filename,
                      mimeType: att.contentType || "application/octet-stream",
                      size: att.content.length,
                      storageUrl: `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${key}`,
                      contentId: att.contentId,
                    },
                  });
                })
              );
              email.attachments = [...email.attachments, ...createdAttachments];
            } catch (attachmentError) {
              console.error("[GET_EMAIL_ATTACHMENT_UPLOAD]", attachmentError);
            }
          }

          // Trigger embed only if already CRM-linked (avoids embedding unrelated emails)
          const isLinked = email.contacts.length > 0 || email.accounts.length > 0;
          if (isLinked) {
            const { inngest } = await import("@/inngest/client");
            inngest.send({ name: "email/embed-email", data: { emailId: id } });
          }
        }
      }
    } catch {
      // Body fetch failed — return email without body; display will show a fallback
    }
  }

  // Mark as read (fire-and-forget)
  if (!email.isRead) {
    prismadb.email.update({ where: { id }, data: { isRead: true } }).catch(() => {});
  }

  return serializeDecimals(email);
}

/** A message's direct parent: its In-Reply-To, or — if that's missing — the
 * *last* entry in References. RFC convention lists References oldest to
 * newest, so the last entry is the immediate parent. Using the first entry
 * (the thread's original root) instead over-merges: any later branch that
 * happens to trace back through the same distant ancestor gets pulled into
 * every other branch, even ones that only share that root by coincidence
 * (e.g. someone hitting "Reply" on an old thread to start a conversation
 * with a different, unrelated person). */
function directParentOf(e: { inReplyTo: string | null; references: unknown }): string | null {
  if (e.inReplyTo) return e.inReplyTo;
  const refs = Array.isArray(e.references) ? (e.references as string[]) : [];
  return refs.length > 0 ? refs[refs.length - 1] : null;
}

export async function getEmailThread(id: string) {
  const userId = await requireSession();
  const targetEmail = await getEmail(id);
  if (!targetEmail) return [];

  // Candidate pool to search within — subject match is just a cheap way to
  // bound the query; actual thread membership is decided below via direct
  // parent/child/sibling edges, not subject text.
  const cleanSubject = targetEmail.subject
    ? targetEmail.subject.replace(/^(re|fwd|fw)(\[\d+\])?:\s*/gi, "").trim()
    : null;

  const candidates = await prismadb.email.findMany({
    where: {
      userId,
      emailAccountId: targetEmail.emailAccountId,
      isDeleted: false,
      OR: [
        { id: targetEmail.id },
        ...(cleanSubject ? [{ subject: { contains: cleanSubject, mode: "insensitive" as const } }] : []),
      ],
    },
    orderBy: { sentAt: "asc" },
    include: { attachments: true },
  });

  const byId = new Map(candidates.map((e) => [e.id, e]));
  const included = new Set<string>([targetEmail.id]);
  let frontier = [targetEmail.id];

  // Expand outward level by level: a candidate joins the thread only if
  // it's a direct child, direct sibling (same immediate parent), or direct
  // parent of something already included — never merely a distant relative.
  while (frontier.length > 0) {
    const frontierParents = new Set(
      frontier.map((fid) => directParentOf(byId.get(fid)!)).filter((p): p is string => !!p)
    );
    const next: string[] = [];

    for (const e of candidates) {
      if (included.has(e.id)) continue;
      const parent = directParentOf(e);
      const isChildOfFrontier = frontier.some((fid) => byId.get(fid)!.rfcMessageId === parent);
      const isSiblingOfFrontier = parent !== null && frontierParents.has(parent);
      const isParentOfFrontier = frontier.some((fid) => directParentOf(byId.get(fid)!) === e.rfcMessageId);
      if (isChildOfFrontier || isSiblingOfFrontier || isParentOfFrontier) {
        included.add(e.id);
        next.push(e.id);
      }
    }
    frontier = next;
  }

  const thread = candidates.filter((e) => included.has(e.id));
  return serializeDecimalsList(thread.length > 0 ? thread : [targetEmail]);
}

export async function deleteEmail(id: string) {
  const userId = await requireSession();
  const email = await prismadb.email.findFirst({ where: { id, userId } });
  if (!email) throw new Error("Not found");
  await prismadb.email.update({ where: { id }, data: { isDeleted: true } });
}

export type AttachmentInput = {
  filename: string;
  contentType: string;
  size?: number;
  // Object key of a file already uploaded to MinIO via a presigned URL
  // (see /api/upload/presigned-url) — attachments are uploaded directly to
  // storage from the browser rather than inlined into this Server Action's
  // request body, since Cloudflare rejects request bodies much above ~1MB.
  // Provide either this or storageUrl (used for forwarding an attachment
  // that's already sitting in storage, e.g. from the original message).
  storageKey?: string;
  storageUrl?: string;
};

function resolveAttachmentStorageKey(att: AttachmentInput): string {
  if (att.storageKey) return att.storageKey;
  if (att.storageUrl) {
    const prefix = `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/`;
    if (att.storageUrl.startsWith(prefix)) return att.storageUrl.slice(prefix.length);
  }
  throw new Error(`Cannot resolve storage location for attachment "${att.filename}"`);
}

export type SendInput = {
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  inReplyTo?: string;   // parent's Message-ID
  references?: string;  // parent's References + parent's Message-ID (space-separated)
  attachments?: AttachmentInput[];
};

import { getUKRBASignature, getUKRBASignatureHtml, parseMarkdownToEmailHtml, stripExistingSignature } from "@/lib/email-signature";

export async function sendEmail(input: SendInput) {
  try {
    return await sendEmailInternal(input);
  } catch (err: any) {
    // Next.js redacts thrown Server Action errors in production ("An error
    // occurred in the Server Components render...") — returning an error
    // value instead is the only way the real message reaches the client.
    console.error("[SEND_EMAIL_ERROR]", err);
    const raw = err instanceof Error ? err.message : "Failed to send email";
    const isTooLarge = err?.responseCode === 552 || /message (file )?too big|size limit|exceed/i.test(raw);
    const message = isTooLarge
      ? `Your mail server rejected this message because it's too large to send. Attachments are transmitted as one combined message, which inflates their size by roughly a third — try compressing the file(s) or sending a smaller one. (Server said: ${raw})`
      : raw;
    return { error: message };
  }
}

async function sendEmailInternal(input: SendInput) {
  const userId = await requireSession();

  let account = await prismadb.emailAccount.findFirst({
    where: { id: input.accountId, userId },
  });

  if (!account) {
    // Fallback to user's first active email account if specified accountId is stale or missing
    account = await prismadb.emailAccount.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: "asc" },
    });
  }

  if (!account) {
    // Final fallback: any account owned by the user
    account = await prismadb.emailAccount.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  }

  if (!account) throw new Error("No connected email account found for your profile. Please add your email account in Settings.");

  const user = await prismadb.users.findUnique({
    where: { id: userId },
    select: { name: true, role: true, phone: true },
  });

  // Strip any pre-existing/duplicate signature lines from input body
  const cleanedBody = stripExistingSignature(input.body);

  // Prepare text body (strip HTML tags if body contains HTML)
  let cleanBodyText = cleanedBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  cleanBodyText += getUKRBASignature({ name: user?.name, role: user?.role, phone: user?.phone });

  // Prepare HTML body with embedded logo signature & markdown parsing (bold, italic, lists, links)
  const htmlContentLines = parseMarkdownToEmailHtml(cleanedBody);
  const bodyHtml = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #1f2937; line-height: 1.6;">${htmlContentLines}</div>${getUKRBASignatureHtml({ name: user?.name, role: user?.role, phone: user?.phone }, UKRBA_LOGO_DATA_URI)}`;

  let password = "";
  try {
    password = decrypt(account.passwordEncrypted);
  } catch (err: any) {
    console.error("Failed to decrypt password for account:", account.username, err);
    throw new Error(`Invalid or corrupted credentials for ${account.username}. Please re-enter the account password in Settings -> Email Accounts.`);
  }

  const isSecure = account.smtpPort === 465 || account.smtpSsl;
  const transporter = nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: isSecure,
    auth: { user: account.username, pass: password },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // Prepare Nodemailer attachments — fetch bytes from MinIO server-side
  // (the file was uploaded there directly by the browser via a presigned URL)
  const mailAttachments = input.attachments?.length
    ? await Promise.all(
        input.attachments.map(async (att) => {
          const obj = await minioClient.send(
            new GetObjectCommand({ Bucket: MINIO_BUCKET, Key: resolveAttachmentStorageKey(att) })
          );
          const bytes = await obj.Body!.transformToByteArray();
          return {
            filename: att.filename,
            content: Buffer.from(bytes),
            contentType: att.contentType,
          };
        })
      )
    : undefined;

  const fromHeader = account.label && account.label !== account.username
    ? `"${account.label}" <${account.username}>`
    : user?.name
      ? `"${user.name}" <${account.username}>`
      : account.username;

  let info;
  try {
    info = await transporter.sendMail({
      from: fromHeader,
      to: input.to.join(", "),
      cc: input.cc?.join(", "),
      bcc: input.bcc?.join(", "),
      subject: input.subject,
      text: cleanBodyText,
      html: bodyHtml,
      inReplyTo: input.inReplyTo,
      references: input.references,
      attachments: mailAttachments,
    });
  } catch (err: any) {
    if (fromHeader !== account.username) {
      try {
        info = await transporter.sendMail({
          from: account.username,
          to: input.to.join(", "),
          cc: input.cc?.join(", "),
          bcc: input.bcc?.join(", "),
          subject: input.subject,
          text: cleanBodyText,
          html: bodyHtml,
          inReplyTo: input.inReplyTo,
          references: input.references,
          attachments: mailAttachments,
        });
      } catch (retryErr: any) {
        console.error("SMTP error sending email:", retryErr);
        throw new Error(retryErr.message || `SMTP Error: Could not send email via ${account.username}`);
      }
    } else {
      console.error("SMTP error sending email:", err);
      throw new Error(err.message || `SMTP Error: Could not send email via ${account.username}`);
    }
  }

  // Write sent message to DB immediately so it appears in Sent view & thread with HTML logo signature
  const created = await prismadb.email.create({
    data: {
      emailAccountId: input.accountId,
      userId,
      rfcMessageId: info.messageId ?? `local-${crypto.randomUUID()}@nextcrm`,
      folder: EmailFolder.SENT,
      subject: input.subject,
      fromEmail: account.username,
      toRecipients: input.to.map((e) => ({ email: e })),
      ccRecipients: input.cc?.map((e) => ({ email: e })) ?? [],
      bccRecipients: input.bcc?.map((e) => ({ email: e })) ?? [],
      bodyText: cleanBodyText,
      bodyHtml: bodyHtml,
      sentAt: new Date(),
      isRead: true,
    },
  });

  // Store attachment records in DB if present
  if (input.attachments && input.attachments.length > 0) {
    await prismadb.emailAttachment.createMany({
      data: input.attachments.map((att) => ({
        emailId: created.id,
        filename: att.filename,
        mimeType: att.contentType || "application/octet-stream",
        size: att.size || 0,
        storageUrl: att.storageUrl || `${MINIO_PUBLIC_URL}/${MINIO_BUCKET}/${resolveAttachmentStorageKey(att)}`,
      })),
    });
  }

  const emailData = await getEmail(created.id);
  return serializeDecimals(emailData);
}
