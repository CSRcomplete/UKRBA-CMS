import { inngest } from "@/inngest/client";
import { prismadb } from "@/lib/prisma";
import { decrypt } from "@/lib/email-crypto";
import { fetchBodyByMessageId, fetchBodyByUid } from "@/inngest/lib/imap-utils";

export const emailLinkCrm = inngest.createFunction(
  {
    id: "email-link-crm",
    name: "Email: Link to CRM",
    triggers: [{ event: "email/link-crm" }],
  },
  async ({ event, step }) => {
    const { emailId } = event.data as { emailId: string };

    const email = await prismadb.email.findUnique({
      where: { id: emailId },
      select: {
        fromEmail: true,
        toRecipients: true,
        ccRecipients: true,
        imapUid: true,
        rfcMessageId: true,
        folder: true,
        emailAccountId: true,
      },
    });
    if (!email) return { skipped: "not found" };

    // Collect all addresses (exclude BCC — privacy)
    const addresses = [
      email.fromEmail,
      ...(email.toRecipients as { email?: string }[]).map((r) => r.email),
      ...(email.ccRecipients as { email?: string }[]).map((r) => r.email),
    ]
      .filter((e): e is string => typeof e === "string" && e.length > 0)
      .map((e) => e.toLowerCase());

    if (addresses.length === 0) return { linked: 0 };

    const linked = await step.run("match-and-link", async () => {
      const [contacts, accounts] = await Promise.all([
        prismadb.crm_Contacts.findMany({
          where: { email: { in: addresses } },
          select: { id: true },
        }),
        prismadb.crm_Accounts.findMany({
          where: { email: { in: addresses } },
          select: { id: true },
        }),
      ]);

      const contactLinks = contacts.map((c) => ({ emailId, contactId: c.id }));
      const accountLinks = accounts.map((a) => ({ emailId, accountId: a.id }));

      if (contactLinks.length > 0) {
        await prismadb.emailsToContacts.createMany({ data: contactLinks, skipDuplicates: true });
      }
      if (accountLinks.length > 0) {
        await prismadb.emailsToAccounts.createMany({ data: accountLinks, skipDuplicates: true });
      }

      return contactLinks.length + accountLinks.length;
    });

    // Body is fetched for every synced email regardless of CRM linkage —
    // staff correspondence with no matching Contact/Account still needs to
    // be readable in the inbox. Only the (OpenAI-billed) embedding step
    // stays gated to CRM-relevant emails.
    if (email.imapUid) {
      const emailAccount = await prismadb.emailAccount.findUnique({
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

      if (emailAccount) {
        const folderName =
          email.folder === "SENT"
            ? (emailAccount.sentFolderName || "Sent")
            : "INBOX";

        // Wrap body fetch in step.run for idempotent retry behaviour
        await step.run("fetch-and-save-body", async () => {
          try {
            const creds = {
              username: emailAccount.username,
              password: decrypt(emailAccount.passwordEncrypted),
              imapHost: emailAccount.imapHost,
              imapPort: emailAccount.imapPort,
              imapSsl: emailAccount.imapSsl,
            };

            // Our own synthetic fallback IDs (used when a header had no real
            // Message-ID) never appear on the server, so a Message-ID search
            // can't find them — UID is the only option in that case. When a
            // *real* Message-ID search comes up empty, the message is most
            // likely gone from that folder — falling back to the stored UID
            // there would risk fetching a different message that has since
            // taken over that UID, so we deliberately don't.
            const isRealMessageId = !email.rfcMessageId.endsWith("-header@local");

            const body = isRealMessageId
              ? await fetchBodyByMessageId(creds, folderName, email.rfcMessageId)
              : email.imapUid
                ? await fetchBodyByUid(creds, folderName, email.imapUid)
                : {};

            await prismadb.email.update({
              where: { id: emailId },
              data: {
                bodyText: body.bodyText ?? null,
                bodyHtml: body.bodyHtml ?? null,
                inReplyTo: body.inReplyTo ?? undefined,
                references: body.references ?? undefined,
              },
            });
          } catch (e) {
            console.warn(`[link-crm] Body fetch failed for email ${emailId}:`, e);
            // embed will still fire with subject-only text
          }
        });

        if (linked > 0) {
          await step.sendEvent("trigger-embed", {
            name: "email/embed-email",
            data: { emailId },
          });
        }
      } else {
        console.warn(
          `[link-crm] EmailAccount ${email.emailAccountId} not found for email ${emailId} — skipping body fetch`
        );
      }
    }

    return { linked };
  }
);
