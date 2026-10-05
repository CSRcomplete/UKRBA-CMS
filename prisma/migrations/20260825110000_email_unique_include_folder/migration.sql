-- Sending a message to yourself delivers the identical Message-ID into
-- both this account's Sent AND Inbox folders. The old constraint only
-- allowed one row per (account, rfcMessageId), so the Inbox copy always
-- lost the race and was silently never recorded. Widening the constraint
-- to include folder lets both copies exist as separate rows.
ALTER TABLE "Email" DROP CONSTRAINT "Email_emailAccountId_rfcMessageId_key";
ALTER TABLE "Email" ADD CONSTRAINT "Email_emailAccountId_folder_rfcMessageId_key" UNIQUE ("emailAccountId", "folder", "rfcMessageId");
