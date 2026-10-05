"use server";
import { getSession } from "@/lib/auth-server";

import { prismadb } from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { performEmailAccountSync } from "@/lib/email-sync";

async function requireSession() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id as string;
}

export async function triggerSync(accountId: string) {
  const userId = await requireSession();

  const account = await prismadb.emailAccount.findFirst({
    where: { id: accountId, userId },
    select: { id: true },
  });
  if (!account) throw new Error("Account not found");

  // Perform immediate direct IMAP sync
  await performEmailAccountSync(accountId);

  // Send background event to Inngest if active
  try {
    await inngest.send({ name: "email/sync-account", data: { accountId } });
  } catch {
    // Inngest daemon might be offline; direct sync already completed above
  }
}
