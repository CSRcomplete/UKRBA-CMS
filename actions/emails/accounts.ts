"use server";
import { getSession } from "@/lib/auth-server";

import { prismadb } from "@/lib/prisma";
import { encrypt } from "@/lib/email-crypto";
import Imap from "imap";

async function requireSession() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id as string;
}

import { serializeDecimalsList } from "@/lib/serialize-decimals";

export async function getEmailAccounts() {
  const userId = await requireSession();
  try {
    const accounts = await prismadb.emailAccount.findMany({
      where: { userId },
      select: {
        id: true,
        label: true,
        imapHost: true,
        imapPort: true,
        imapSsl: true,
        smtpHost: true,
        smtpPort: true,
        smtpSsl: true,
        username: true,
        isActive: true,
        sentFolderName: true,
        lastSyncedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return serializeDecimalsList(accounts);
  } catch (err) {
    console.error("Failed to fetch email accounts:", err);
    return [];
  }
}

type CreateInput = {
  label: string;
  imapHost: string;
  imapPort: number;
  imapSsl: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSsl: boolean;
  username: string;
  password: string;
  sentFolderName?: string;
};

import { performEmailAccountSync } from "@/lib/email-sync";

export async function createEmailAccount(input: CreateInput) {
  const userId = await requireSession();

  // Validate required string fields
  if (!input.label?.trim()) throw new Error("Label is required");
  if (!input.imapHost?.trim()) throw new Error("IMAP host is required");
  if (!input.smtpHost?.trim()) throw new Error("SMTP host is required");
  if (!input.username?.trim()) throw new Error("Username is required");
  if (!input.password?.trim()) throw new Error("Password is required");
  if (input.imapPort < 1 || input.imapPort > 65535) throw new Error("Invalid IMAP port");
  if (input.smtpPort < 1 || input.smtpPort > 65535) throw new Error("Invalid SMTP port");

  const passwordEncrypted = encrypt(input.password);
  const created = await prismadb.emailAccount.create({
    data: {
      userId,
      label: input.label,
      imapHost: input.imapHost,
      imapPort: input.imapPort,
      imapSsl: input.imapSsl,
      smtpHost: input.smtpHost,
      smtpPort: input.smtpPort,
      smtpSsl: input.smtpSsl,
      username: input.username,
      passwordEncrypted,
      ...(input.sentFolderName && { sentFolderName: input.sentFolderName }),
    },
    select: { id: true, label: true },
  });

  // Trigger immediate initial IMAP sync (non-blocking)
  performEmailAccountSync(created.id).catch(() => {});

  return created;
}

export async function deleteEmailAccount(id: string) {
  const userId = await requireSession();
  const account = await prismadb.emailAccount.findFirst({ where: { id, userId } });
  if (!account) throw new Error("Not found");
  await prismadb.emailAccount.delete({ where: { id } });
}

export async function setEmailAccountActive(id: string, isActive: boolean) {
  const userId = await requireSession();
  const account = await prismadb.emailAccount.findFirst({ where: { id, userId } });
  if (!account) throw new Error("Not found");
  return prismadb.emailAccount.update({ where: { id }, data: { isActive } });
}

type TestInput = {
  imapHost: string;
  imapPort: number;
  imapSsl: boolean;
  username: string;
  password: string;
};

export async function testEmailConnection(
  input: TestInput
): Promise<{ ok: boolean; error?: string }> {
  await requireSession();

  const username = (input.username || "").trim();
  const password = input.password || "";
  const imapHost = (input.imapHost || "").trim();

  if (!username || !password || !imapHost) {
    return { ok: false, error: "Username, password, and IMAP host are required." };
  }

  const connectionPromise = new Promise<{ ok: boolean; error?: string }>((resolve) => {
    const imap = new Imap({
      user: username,
      password: password,
      host: imapHost,
      port: input.imapPort || 993,
      tls: input.imapSsl ?? true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
      connTimeout: 10000,
    });
    imap.once("ready", () => {
      imap.end();
      resolve({ ok: true });
    });
    imap.once("error", (err: Error) => {
      let msg = err.message || "Authentication failed";
      console.error(`IMAP test error for ${username}:`, err);
      if (msg.includes("AUTHENTICATIONFAILED") || msg.toLowerCase().includes("auth")) {
        msg = `Authentication failed for ${username}. On Hostinger, click the three dots next to the mailbox -> 'App passwords', generate an App Password, and paste it here.`;
      }
      resolve({ ok: false, error: msg });
    });
    imap.connect();
  });

  const timeoutPromise = new Promise<{ ok: boolean; error?: string }>((resolve) =>
    setTimeout(() => resolve({ ok: false, error: "Connection timed out connecting to " + imapHost }), 12000)
  );

  return Promise.race([connectionPromise, timeoutPromise]);
}

type ListFoldersInput = {
  imapHost: string;
  imapPort: number;
  imapSsl: boolean;
  username: string;
  password: string;
};

export async function listImapFolders(
  input: ListFoldersInput
): Promise<{ ok: true; folders: string[] } | { ok: false; error: string }> {
  await requireSession();

  const username = (input.username || "").trim();
  const password = input.password || "";
  const imapHost = (input.imapHost || "").trim();

  return new Promise((resolve) => {
    const imap = new Imap({
      user: username,
      password: password,
      host: imapHost,
      port: input.imapPort || 993,
      tls: input.imapSsl ?? true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 10000,
      connTimeout: 10000,
    });

    imap.once("ready", () => {
      imap.getBoxes("", (err, boxes) => {
        imap.end();
        if (err) return resolve({ ok: false, error: err.message });

        const names: string[] = [];
        function walk(node: Imap.MailBoxes, prefix: string) {
          for (const [name, box] of Object.entries(node)) {
            const full = prefix ? `${prefix}${box.delimiter ?? "/"}${name}` : name;
            names.push(full);
            if (box.children) walk(box.children, full);
          }
        }
        walk(boxes, "");
        resolve({ ok: true, folders: names.sort() });
      });
    });

    imap.once("error", (err: Error) => resolve({ ok: false, error: err.message }));
    imap.connect();

    setTimeout(() => resolve({ ok: false, error: "Connection timed out" }), 12000);
  });
}
