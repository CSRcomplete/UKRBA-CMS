#!/usr/bin/env tsx
/**
 * One-off backfill: fetches body content for emails that were synced before
 * the CRM-linkage gate on body fetching was removed (link-crm.ts). Any
 * email between people not already CRM Contacts/Accounts — e.g. ordinary
 * internal staff correspondence — was left with a null body forever.
 *
 * Usage: npx tsx scripts/backfill-email-bodies.ts
 */
import { prismadb } from "@/lib/prisma";
import { decrypt } from "@/lib/email-crypto";
import { fetchBodyByUid } from "@/inngest/lib/imap-utils";

async function main() {
  const emails = await prismadb.email.findMany({
    where: { bodyText: null, bodyHtml: null, imapUid: { not: null } },
    select: { id: true, imapUid: true, folder: true, emailAccountId: true },
  });

  console.log(`Found ${emails.length} emails with missing body content`);

  const accountCache = new Map<string, Awaited<ReturnType<typeof prismadb.emailAccount.findUnique>>>();
  let fixed = 0;
  let failed = 0;

  for (const email of emails) {
    let account = accountCache.get(email.emailAccountId);
    if (account === undefined) {
      account = await prismadb.emailAccount.findUnique({
        where: { id: email.emailAccountId },
      });
      accountCache.set(email.emailAccountId, account);
    }
    if (!account) {
      failed++;
      continue;
    }

    const folderName = email.folder === "SENT" ? (account.sentFolderName || "Sent") : "INBOX";

    try {
      const body = await fetchBodyByUid(
        {
          username: account.username,
          password: decrypt(account.passwordEncrypted),
          imapHost: account.imapHost,
          imapPort: account.imapPort,
          imapSsl: account.imapSsl,
        },
        folderName,
        email.imapUid!
      );

      await prismadb.email.update({
        where: { id: email.id },
        data: { bodyText: body.bodyText ?? null, bodyHtml: body.bodyHtml ?? null },
      });
      fixed++;
    } catch (e) {
      console.warn(`Failed for email ${email.id}:`, (e as Error).message);
      failed++;
    }
  }

  console.log(`Done. Fixed: ${fixed}, Failed: ${failed}, Total: ${emails.length}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
