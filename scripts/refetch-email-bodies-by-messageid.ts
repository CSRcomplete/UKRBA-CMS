#!/usr/bin/env tsx
/**
 * Corrective re-fetch: bodies previously fetched by stored IMAP UID could
 * have been silently attributed to the wrong message if a mailbox got
 * reindexed server-side after the UID was first recorded (UIDs are only
 * stable within one UIDVALIDITY session). This re-fetches every synced
 * email's body by its permanent Message-ID instead, overwriting whatever
 * is currently stored — including non-null bodies, since those may already
 * be wrong.
 *
 * Usage: node --env-file=.env ./node_modules/.bin/tsx scripts/refetch-email-bodies-by-messageid.ts
 */
import { prismadb } from "@/lib/prisma";
import { decrypt } from "@/lib/email-crypto";
import { fetchBodiesByMessageIds } from "@/inngest/lib/imap-utils";

async function main() {
  const emails = await prismadb.email.findMany({
    where: { imapUid: { not: null } },
    select: { id: true, rfcMessageId: true, folder: true, emailAccountId: true },
  });

  console.log(`Found ${emails.length} synced emails to re-verify`);

  const byGroup = new Map<string, typeof emails>();
  for (const email of emails) {
    if (email.rfcMessageId.endsWith("-header@local")) continue; // no real Message-ID to search by
    const key = `${email.emailAccountId}::${email.folder}`;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key)!.push(email);
  }

  const accountCache = new Map<string, Awaited<ReturnType<typeof prismadb.emailAccount.findUnique>>>();
  let updated = 0;
  let unchanged = 0;
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
      const bodies = await fetchBodiesByMessageIds(
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
        const body = bodies.get(email.rfcMessageId);
        if (!body) {
          notFound++;
          continue;
        }
        if (!body.bodyText && !body.bodyHtml) {
          unchanged++;
          continue;
        }
        await prismadb.email.update({
          where: { id: email.id },
          data: { bodyText: body.bodyText ?? null, bodyHtml: body.bodyHtml ?? null },
        });
        updated++;
      }
    } catch (e) {
      groupsFailed++;
      console.warn(`Group failed (${key}):`, (e as Error).message);
    }
  }

  console.log(
    `Done. Updated: ${updated}, No content found: ${unchanged}, Message not found on server: ${notFound}, Groups failed: ${groupsFailed}, Total: ${emails.length}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
