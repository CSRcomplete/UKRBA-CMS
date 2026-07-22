import { prismadb } from "@/lib/prisma";
import { decrypt } from "@/lib/email-crypto";
import { EmailFolder } from "@prisma/client";
import Imap from "imap";
import { connectImap, fetchHeaders, type ParsedHeader } from "@/inngest/lib/imap-utils";

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

async function searchFolder(
  imap: Imap,
  folderName: string,
  lastUid: number
): Promise<{ uids: number[]; highestUid: number }> {
  return new Promise((resolve, reject) => {
    imap.openBox(folderName, true, (err) => {
      if (err) return resolve({ uids: [], highestUid: lastUid });

      const criteria: unknown[] =
        lastUid > 0
          ? [["UID", `${lastUid + 1}:*`]]
          : [["SINCE", new Date(Date.now() - SIX_MONTHS_MS)]];

      imap.search(criteria, (searchErr, uids) => {
        if (searchErr) return resolve({ uids: [], highestUid: lastUid });
        const validUids = uids ?? [];
        const highest = validUids.length > 0 ? validUids.reduce((a, b) => Math.max(a, b), lastUid) : lastUid;
        imap.closeBox(() => resolve({ uids: validUids, highestUid: highest }));
      });
    });
  });
}

export async function performEmailAccountSync(accountId: string) {
  const account = await prismadb.emailAccount.findUnique({ where: { id: accountId } });
  if (!account) return { synced: 0, newMessages: 0 };

  const sentFolder = account.sentFolderName || "Sent";
  const pwd = decrypt(account.passwordEncrypted);
  const acc = {
    username: account.username,
    password: pwd,
    imapHost: account.imapHost,
    imapPort: account.imapPort,
    imapSsl: account.imapSsl,
  };

  const [inbox, sent] = await Promise.all([
    connectImap(acc).then(async (imap) => {
      try { return await searchFolder(imap, "INBOX", account.inboxLastUid ?? 0); }
      catch { return { uids: [], highestUid: account.inboxLastUid ?? 0 }; }
      finally { imap.end(); }
    }).catch(() => ({ uids: [], highestUid: account.inboxLastUid ?? 0 })),

    connectImap(acc).then(async (imap) => {
      try { return await searchFolder(imap, sentFolder, account.sentLastUid ?? 0); }
      catch { return { uids: [], highestUid: account.sentLastUid ?? 0 }; }
      finally { imap.end(); }
    }).catch(() => ({ uids: [], highestUid: account.sentLastUid ?? 0 })),
  ]);

  const inboxUids = inbox.uids;
  const sentUids = sent.uids;

  if (inboxUids.length === 0 && sentUids.length === 0) {
    await prismadb.emailAccount.update({
      where: { id: accountId },
      data: { lastSyncedAt: new Date() },
    });
    return { synced: 0, newMessages: 0 };
  }

  const [inboxHeaders, sentHeaders] = await Promise.all([
    inboxUids.length > 0
      ? connectImap(acc).then(async (imap) => {
          try {
            await new Promise<void>((res, rej) =>
              imap.openBox("INBOX", true, (err) => err ? rej(err) : res())
            );
            return fetchHeaders(imap, inboxUids);
          } finally { imap.end(); }
        }).catch(() => [] as ParsedHeader[])
      : Promise.resolve([] as ParsedHeader[]),
    sentUids.length > 0
      ? connectImap(acc).then(async (imap) => {
          try {
            await new Promise<void>((res, rej) =>
              imap.openBox(sentFolder, true, (err) => err ? rej(err) : res())
            );
            return fetchHeaders(imap, sentUids);
          } finally { imap.end(); }
        }).catch(() => [] as ParsedHeader[])
      : Promise.resolve([] as ParsedHeader[]),
  ]);

  const allMessages = [
    ...inboxHeaders.map((m) => ({ ...m, folder: EmailFolder.INBOX })),
    ...sentHeaders.map((m) => ({ ...m, folder: EmailFolder.SENT })),
  ].filter((m) => !!m.rfcMessageId);

  if (allMessages.length === 0) {
    await prismadb.emailAccount.update({
      where: { id: accountId },
      data: { lastSyncedAt: new Date(), inboxLastUid: inbox.highestUid, sentLastUid: sent.highestUid },
    });
    return { synced: 0, newMessages: 0 };
  }

  const rfcIds = allMessages.map((m) => m.rfcMessageId);
  const existing = await prismadb.email.findMany({
    where: { emailAccountId: accountId, rfcMessageId: { in: rfcIds } },
    select: { rfcMessageId: true },
  });
  const existingSet = new Set(existing.map((e) => e.rfcMessageId));
  const newMessages = allMessages.filter((m) => !existingSet.has(m.rfcMessageId));

  if (newMessages.length > 0) {
    await prismadb.email.createMany({
      data: newMessages.map((msg) => ({
        emailAccountId: accountId,
        userId: account.userId,
        rfcMessageId: msg.rfcMessageId,
        imapUid: msg.uid,
        folder: msg.folder,
        subject: msg.subject,
        fromName: msg.fromName,
        fromEmail: msg.fromEmail,
        toRecipients: msg.to,
        ccRecipients: msg.cc,
        sentAt: msg.sentAt,
      })),
      skipDuplicates: true,
    }));
  }

  await prismadb.emailAccount.update({
    where: { id: accountId },
    data: { lastSyncedAt: new Date(), inboxLastUid: inbox.highestUid, sentLastUid: sent.highestUid },
  });

  return { synced: allMessages.length, newMessages: newMessages.length };
}
