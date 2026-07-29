"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { encrypt } from "@/lib/email-crypto";
import { performEmailAccountSync } from "@/lib/email-sync";

async function requireAdminOrCeo() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const role = (session.user.role || "").toLowerCase();
  if (role !== "admin" && role !== "ceo") {
    throw new Error("Security Restriction: Only CEO and Admin can manage user email accounts.");
  }
  return session;
}

export type AdminCreateEmailAccountInput = {
  targetUserId: string;
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

export async function createEmailAccountAdmin(input: AdminCreateEmailAccountInput) {
  await requireAdminOrCeo();

  if (!input.targetUserId) throw new Error("Target User ID is required");
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
      userId: input.targetUserId,
      label: input.label.trim(),
      imapHost: input.imapHost.trim(),
      imapPort: input.imapPort,
      imapSsl: input.imapSsl,
      smtpHost: input.smtpHost.trim(),
      smtpPort: input.smtpPort,
      smtpSsl: input.smtpSsl,
      username: input.username.trim(),
      passwordEncrypted,
      ...(input.sentFolderName ? { sentFolderName: input.sentFolderName.trim() } : {}),
    },
    select: { id: true, label: true },
  });

  // Trigger initial background IMAP sync
  performEmailAccountSync(created.id).catch(() => {});

  revalidatePath("/[locale]/(routes)/admin/users", "page");
  revalidatePath(`/[locale]/(routes)/admin/users/${input.targetUserId}`, "page");

  return { success: true, account: created };
}

export async function deleteEmailAccountAdmin(targetUserId: string, accountId: string) {
  await requireAdminOrCeo();

  const account = await prismadb.emailAccount.findFirst({
    where: { id: accountId, userId: targetUserId },
  });

  if (!account) throw new Error("Email account not found for this user");

  await prismadb.emailAccount.delete({
    where: { id: accountId },
  });

  revalidatePath("/[locale]/(routes)/admin/users", "page");
  revalidatePath(`/[locale]/(routes)/admin/users/${targetUserId}`, "page");

  return { success: true };
}

export async function toggleEmailAccountActiveAdmin(targetUserId: string, accountId: string, isActive: boolean) {
  await requireAdminOrCeo();

  const account = await prismadb.emailAccount.findFirst({
    where: { id: accountId, userId: targetUserId },
  });

  if (!account) throw new Error("Email account not found for this user");

  const updated = await prismadb.emailAccount.update({
    where: { id: accountId },
    data: { isActive },
  });

  revalidatePath("/[locale]/(routes)/admin/users", "page");
  revalidatePath(`/[locale]/(routes)/admin/users/${targetUserId}`, "page");

  return { success: true, updated };
}
