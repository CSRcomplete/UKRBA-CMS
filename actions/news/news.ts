"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";

export type AnnouncementCategory =
  | "Company News"
  | "Marketing Campaigns"
  | "Operational Updates"
  | "Software Updates"
  | "New Resources"
  | "Compliance Notices"
  | "Staff Announcements";

export type AnnouncementItem = {
  id: string;
  title: string;
  category: string;
  content: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  isPinned: boolean;
  authorId: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
  updatedAt: string;
};

async function requireSession() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function getAnnouncements(category?: string): Promise<{
  announcements: AnnouncementItem[];
  isAdmin: boolean;
}> {
  const user = await requireSession();
  const userId = user.id as string;

  const dbUser = await prismadb.users.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const role = dbUser?.role?.toLowerCase() || "";
  const isAdmin = ["admin", "ceo"].includes(role);

  const where: any = { deletedAt: null };
  if (category && category !== "All") {
    where.category = category;
  }

  const list = await prismadb.crm_Announcements.findMany({
    where,
    include: {
      author: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  const formatted: AnnouncementItem[] = list.map((item) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    content: item.content,
    attachmentUrl: item.attachmentUrl,
    attachmentName: item.attachmentName,
    attachmentSize: item.attachmentSize,
    isPinned: item.isPinned,
    authorId: item.authorId,
    authorName: item.author.name || item.author.email || "UKRBA Admin",
    authorRole: item.author.role || "Administrator",
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  return { announcements: formatted, isAdmin };
}

export type CreateAnnouncementInput = {
  title: string;
  category: string;
  content: string;
  isPinned?: boolean;
  attachment?: {
    name: string;
    content: string; // base64 string
    contentType?: string;
    size?: number;
  };
};

export async function createAnnouncement(input: CreateAnnouncementInput) {
  const currentUser = await requireSession();
  const userId = currentUser.id as string;

  const dbUser = await prismadb.users.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const role = dbUser?.role?.toLowerCase() || "";
  if (!["admin", "ceo"].includes(role)) {
    throw new Error("Only authorized Administrators can publish announcements.");
  }

  let attachmentUrl: string | undefined = undefined;
  let attachmentName: string | undefined = undefined;
  let attachmentSize: number | undefined = undefined;

  if (input.attachment) {
    attachmentName = input.attachment.name;
    attachmentSize = input.attachment.size || Buffer.from(input.attachment.content, "base64").byteLength;
    attachmentUrl = `data:${input.attachment.contentType || "application/octet-stream"};base64,${input.attachment.content}`;
  }

  const created = await prismadb.crm_Announcements.create({
    data: {
      authorId: userId,
      title: input.title,
      category: input.category || "Company News",
      content: input.content,
      isPinned: input.isPinned ?? false,
      attachmentUrl,
      attachmentName,
      attachmentSize,
    },
  });

  return created;
}

export async function updateAnnouncement(id: string, input: Partial<CreateAnnouncementInput>) {
  const currentUser = await requireSession();
  const userId = currentUser.id as string;

  const dbUser = await prismadb.users.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const role = dbUser?.role?.toLowerCase() || "";
  if (!["admin", "ceo"].includes(role)) {
    throw new Error("Only authorized Administrators can edit announcements.");
  }

  const data: any = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.category !== undefined) data.category = input.category;
  if (input.content !== undefined) data.content = input.content;
  if (input.isPinned !== undefined) data.isPinned = input.isPinned;

  if (input.attachment) {
    data.attachmentName = input.attachment.name;
    data.attachmentSize = input.attachment.size || Buffer.from(input.attachment.content, "base64").byteLength;
    data.attachmentUrl = `data:${input.attachment.contentType || "application/octet-stream"};base64,${input.attachment.content}`;
  }

  const updated = await prismadb.crm_Announcements.update({
    where: { id },
    data,
  });

  return updated;
}

export async function deleteAnnouncement(id: string) {
  const currentUser = await requireSession();
  const userId = currentUser.id as string;

  const dbUser = await prismadb.users.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const role = dbUser?.role?.toLowerCase() || "";
  if (!["admin", "ceo"].includes(role)) {
    throw new Error("Only authorized Administrators can delete announcements.");
  }

  await prismadb.crm_Announcements.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
