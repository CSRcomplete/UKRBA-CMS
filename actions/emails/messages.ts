"use server";
import { getSession } from "@/lib/auth-server";

import { prismadb } from "@/lib/prisma";
import { decrypt } from "@/lib/email-crypto";
import { serializeDecimals } from "@/lib/serialize-decimals";
import nodemailer from "nodemailer";
import { EmailFolder } from "@prisma/client";

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
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body?: string;
}) {
  const userId = await requireSession();

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

  const baseWhere = {
    userId,
    emailAccountId: accountId,
    folder,
    isDeleted: false,
  } as const;

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
        sentAt: true,
        isRead: true,
        folder: true,
      },
    }),
    prismadb.email.count({ where }),
  ]);

  const total = Math.min(rawCount, MAX_COUNT);
  return { emails, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
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
        const { fetchBodyByUid } = await import("@/inngest/lib/imap-utils");
        const folderName = email.folder === "SENT" ? (account.sentFolderName || "Sent") : "INBOX";
        const body = await fetchBodyByUid(
          {
            username: account.username,
            password: decrypt(account.passwordEncrypted),
            imapHost: account.imapHost,
            imapPort: account.imapPort,
            imapSsl: account.imapSsl,
          },
          folderName,
          email.imapUid
        );

        if (body.bodyText || body.bodyHtml) {
          await prismadb.email.update({
            where: { id },
            data: { bodyText: body.bodyText ?? null, bodyHtml: body.bodyHtml ?? null },
          });
          // Patch in-memory so caller gets the body immediately (before any send that may throw)
          email.bodyText = body.bodyText ?? null;
          email.bodyHtml = body.bodyHtml ?? null;
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

export async function getEmailThread(id: string) {
  const userId = await requireSession();
  const targetEmail = await getEmail(id);
  if (!targetEmail) return [];

  // Normalize subject by stripping Re: and Fwd: prefixes
  const cleanSubject = targetEmail.subject
    ? targetEmail.subject.replace(/^(re|fwd|fw|re:\s*|fwd:\s*)+/gi, "").trim()
    : "";

  if (!cleanSubject) return [targetEmail];

  const threadEmails = await prismadb.email.findMany({
    where: {
      userId,
      emailAccountId: targetEmail.emailAccountId,
      isDeleted: false,
      subject: { contains: cleanSubject, mode: "insensitive" },
    },
    orderBy: { sentAt: "asc" },
    include: {
      contacts: { include: { contact: { select: { id: true, first_name: true, last_name: true } } } },
      accounts: { include: { account: { select: { id: true, name: true } } } },
    },
  });

  return threadEmails.length > 0 ? threadEmails : [targetEmail];
}

export async function deleteEmail(id: string) {
  const userId = await requireSession();
  const email = await prismadb.email.findFirst({ where: { id, userId, isDeleted: false } });
  if (!email) throw new Error("Not found");
  await prismadb.email.update({ where: { id }, data: { isDeleted: true } });
}

export type AttachmentInput = {
  filename: string;
  content: string; // base64 string
  contentType?: string;
  size?: number;
};

type SendInput = {
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
  const userId = await requireSession();

  const account = await prismadb.emailAccount.findFirst({
    where: { id: input.accountId, userId },
  });
  if (!account) throw new Error("Email account not found");

  const user = await prismadb.users.findUnique({
    where: { id: userId },
    select: { name: true, role: true },
  });

  // Strip any pre-existing/duplicate signature lines from input body
  const cleanedBody = stripExistingSignature(input.body);

  // Prepare text body (strip HTML tags if body contains HTML)
  let cleanBodyText = cleanedBody.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  cleanBodyText += getUKRBASignature({ name: user?.name, role: user?.role });

  // Prepare HTML body with embedded logo signature & markdown parsing (bold, italic, lists, links)
  const htmlContentLines = parseMarkdownToEmailHtml(cleanedBody);
  const bodyHtml = `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #1f2937; line-height: 1.6;">${htmlContentLines}</div>${getUKRBASignatureHtml({ name: user?.name, role: user?.role })}`;

  let password = "";
  try {
    password = decrypt(account.passwordEncrypted);
  } catch (err: any) {
    console.error("Failed to decrypt password for account:", account.username, err);
    throw new Error(`Invalid or corrupted credentials for ${account.username}. Please re-enter the account password in Settings -> Email Accounts.`);
  }

  const transporter = nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpSsl,
    auth: { user: account.username, pass: password },
  });

  // Prepare Nodemailer attachments
  const mailAttachments = input.attachments?.map((att) => ({
    filename: att.filename,
    content: Buffer.from(att.content, "base64"),
    contentType: att.contentType,
  }));

  let info;
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
  } catch (err: any) {
    console.error("SMTP error sending email:", err);
    throw new Error(err.message || `SMTP Error: Could not send email via ${account.username}`);
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
        size: att.size || Buffer.from(att.content, "base64").byteLength,
        storageUrl: `data:${att.contentType || "application/octet-stream"};base64,${att.content}`,
      })),
    });
  }

  const emailData = await getEmail(created.id);
  return serializeDecimals(emailData);
}
