#!/usr/bin/env tsx
/**
 * Backfill References/In-Reply-To threading headers for emails synced
 * before thread grouping switched from subject-text matching to proper
 * RFC 5322 header-based threading. Without this, old emails have no
 * threading data and getEmailThread() will just show them individually
 * rather than grouped — safe, but less useful than a real conversation view.
 *
 * Usage: node --env-file=.env ./node_modules/.bin/tsx scripts/backfill-email-threading.ts
 */
import { prismadb } from "@/lib/prisma";
import { decrypt } from "@/lib/email-crypto";
import { fetchBodiesByMessageIds } from "@/inngest/lib/imap-utils";

async function main() {
  const emails = await prismadb.email.findMany({
    where: {
      imapUid: { not: null },
      inReplyTo: null,
      references: { equals: [] },
    },
    select: { id: true, rfcMessageId: true, folder: true, emailAccountId: true },
  });

  console.log(`Found ${emails.length} emails missing threading headers`);

  const byGroup = new Map<string, typeof emails>();
  for (const email of emails) {
    if (email.rfcMessageId.endsWith("-header@local")) continue;
    const key = `${email.emailAccountId}::${email.folder}`;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key)!.push(email);
  }

  const accountCache = new Map<string, Awaited<ReturnType<typeof prismadb.emailAccount.findUnique>>>();
  let updated = 0;
  let noHeaders = 0;
  let notFound = 0;
  let groupsFailed = 0;

  let groupIndex = 0;
  for (const [key, group] of Array.from(byGroup.entries())) {
    groupIndex++;
    const [emailAccountId, folder] = key.split("::");

    let account = accountCache.get(emailAccountId);
    if (account === undefined) {
      account = await prismadb.emailAccount.findUnique({ where: { id: emailAccountId } });
      accountCache.set(emailAccountId, account);
    }
    if (!account) continue;

    const folderName = folder === "SENT" ? (account.sentFolderName || "Sent") : "INBOX";

    console.log(`[${groupIndex}/${byGroup.size}] ${account.username} / ${folderName}: ${group.length} messages`);

    try {
      const results = await fetchBodiesByMessageIds(
        {
          username: account.username,
          password: decrypt(account.passwordEncrypted),
          imapHost: account.imapHost,
          imapPort: account.imapPort,
          imapSsl: account.imapSsl,
        },
        folderName,
        group.map((e) => e.rfcMessageId)
      );

      for (const email of group) {
        const result = results.get(email.rfcMessageId);
        if (!result) {
          notFound++;
          continue;
        }
        if (!result.inReplyTo && (!result.references || result.references.length === 0)) {
          noHeaders++;
          continue;
        }
        await prismadb.email.update({
          where: { id: email.id },
          data: {
            inReplyTo: result.inReplyTo ?? null,
            references: result.references ?? [],
          },
        });
        updated++;
      }
    } catch (e) {
      groupsFailed++;
      console.warn(`Group failed (${key}):`, (e as Error).message);
    }
  }

  console.log(
    `Done. Updated: ${updated}, No threading headers (thread starters): ${noHeaders}, Not found on server: ${notFound}, Groups failed: ${groupsFailed}, Total: ${emails.length}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
