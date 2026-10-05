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
  targetGroup?: string | null;
  targetUserIds?: string[];
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
  const isAdmin = ["admin", "ceo", "coo"].includes(role);

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

  // Filter list by target audience hierarchy and specific user assignment
  const visibleList = list.filter((item: any) => {
    if (isAdmin || item.authorId === userId) return true;
    const tg = item.targetGroup || "ALL";
    if (tg === "ALL") return true;
    if (tg === "ALL_REGIONAL_DIRECTORS" && role === "regional_director") return true;
    if (tg === "ALL_AREA_DIRECTORS" && ["area_director", "operations_director"].includes(role)) return true;
    if (tg === "ALL_CHANNEL_PARTNERS" && role === "channel_partner") return true;
    if (Array.isArray(item.targetUserIds) && item.targetUserIds.includes(userId)) return true;
    return false;
  });

  const formatted: AnnouncementItem[] = visibleList.map((item: any) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    content: item.content,
    attachmentUrl: item.attachmentUrl,
    attachmentName: item.attachmentName,
    attachmentSize: item.attachmentSize,
    isPinned: item.isPinned,
    targetGroup: item.targetGroup || "ALL",
    targetUserIds: item.targetUserIds || [],
    authorId: item.authorId,
    authorName: item.author?.name || item.author?.email || "UKRBA Admin",
    authorRole: item.author?.role || "Administrator",
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
  targetGroup?: string;
  targetUserIds?: string[];
  attachment?: {
    name: string;
    url: string; // MinIO storage URL, uploaded client-side via a presigned URL
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
  if (!["admin", "ceo", "coo"].includes(role)) {
    throw new Error("Only authorized Administrators can publish announcements.");
  }

  let attachmentUrl: string | undefined = undefined;
  let attachmentName: string | undefined = undefined;
  let attachmentSize: number | undefined = undefined;

  if (input.attachment) {
    attachmentName = input.attachment.name;
    attachmentSize = input.attachment.size;
    attachmentUrl = input.attachment.url;
  }

  const created = await prismadb.crm_Announcements.create({
    data: {
      authorId: userId,
      title: input.title,
      category: input.category || "Company News",
      content: input.content,
      isPinned: input.isPinned ?? false,
      targetGroup: input.targetGroup || "ALL",
      targetUserIds: input.targetUserIds || [],
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
  if (!["admin", "ceo", "coo"].includes(role)) {
    throw new Error("Only authorized Administrators can edit announcements.");
  }

  const data: any = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.category !== undefined) data.category = input.category;
  if (input.content !== undefined) data.content = input.content;
  if (input.isPinned !== undefined) data.isPinned = input.isPinned;
  if (input.targetGroup !== undefined) data.targetGroup = input.targetGroup;
  if (input.targetUserIds !== undefined) data.targetUserIds = input.targetUserIds;

  if (input.attachment) {
    data.attachmentName = input.attachment.name;
    data.attachmentSize = input.attachment.size;
    data.attachmentUrl = input.attachment.url;
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
  if (!["admin", "ceo", "coo"].includes(role)) {
    throw new Error("Only authorized Administrators can delete announcements.");
  }

  await prismadb.crm_Announcements.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function getUnreadAnnouncementsCount(): Promise<number> {
  const session = await getSession();
  if (!session?.user?.id) return 0;
  const userId = session.user.id;

  try {
    const dbUser = await prismadb.users.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const role = dbUser?.role?.toLowerCase() || "";
    const isAdmin = ["admin", "ceo", "coo"].includes(role);

    const allAnnouncements = await prismadb.crm_Announcements.findMany({
      where: { deletedAt: null },
      select: { id: true, authorId: true, targetGroup: true, targetUserIds: true },
    });

    const visibleAnnouncements = allAnnouncements.filter((item: any) => {
      if (isAdmin || item.authorId === userId) return true;
      const tg = item.targetGroup || "ALL";
      if (tg === "ALL") return true;
      if (tg === "ALL_REGIONAL_DIRECTORS" && role === "regional_director") return true;
      if (tg === "ALL_AREA_DIRECTORS" && ["area_director", "operations_director"].includes(role)) return true;
      if (tg === "ALL_CHANNEL_PARTNERS" && role === "channel_partner") return true;
      if (Array.isArray(item.targetUserIds) && item.targetUserIds.includes(userId)) return true;
      return false;
    });

    if (visibleAnnouncements.length === 0) return 0;

    const visibleIds = visibleAnnouncements.map((a) => a.id);

    const readCount = await prismadb.crm_AnnouncementReads.count({
      where: {
        userId,
        announcementId: { in: visibleIds },
      },
    });

    const unread = visibleIds.length - readCount;
    return unread > 0 ? unread : 0;
  } catch (err) {
    console.error("Error getting unread announcements count:", err);
    return 0;
  }
}

export async function markAnnouncementsAsRead(): Promise<void> {
  const session = await getSession();
  if (!session?.user?.id) return;
  const userId = session.user.id;

  try {
    const announcements = await prismadb.crm_Announcements.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    if (announcements.length === 0) return;

    await prismadb.$transaction(
      announcements.map((a) =>
        prismadb.crm_AnnouncementReads.upsert({
          where: {
            announcementId_userId: {
              announcementId: a.id,
              userId,
            },
          },
          update: {},
          create: {
            announcementId: a.id,
            userId,
          },
        })
      )
    );
  } catch (err) {
    console.error("Error marking announcements as read:", err);
  }
}
