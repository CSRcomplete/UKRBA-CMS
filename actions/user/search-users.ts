"use server";
import { getSession } from "@/lib/auth-server";

import { prismadb } from "@/lib/prisma";
import { leadAssigneeWhere } from "@/lib/lead-assignment";

const PAGE_SIZE_MAX = 100;

export async function searchUsers({
  search = "",
  skip = 0,
  take = 50,
  excludeSystemUsers = false,
  forLeadAssignment = false,
}: {
  search?: string;
  skip?: number;
  take?: number;
  /** Leave out the placeholder "group" users (All Users, All Regional Directors, ...; emails end in @system.local). */
  excludeSystemUsers?: boolean;
  /** Lead owner picker: Regional Directors only see themselves and their own Area Directors. */
  forLeadAssignment?: boolean;
} = {}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  let leadAssigneeScope: ReturnType<typeof leadAssigneeWhere> = null;
  if (forLeadAssignment) {
    const actor = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: { id: true, role: true },
    });
    if (actor) leadAssigneeScope = leadAssigneeWhere(actor);
  }

  const safeTake = Math.min(PAGE_SIZE_MAX, Math.max(1, take));
  const safeSkip = Math.max(0, skip);

  const where = {
    userStatus: "ACTIVE" as const,
    ...(excludeSystemUsers
      ? { NOT: { email: { endsWith: "@system.local" } } }
      : {}),
    ...(leadAssigneeScope ?? {}),
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [users, total] = await prismadb.$transaction([
    prismadb.users.findMany({
      where,
      select: { id: true, name: true, avatar: true },
      orderBy: { name: "asc" },
      skip: safeSkip,
      take: safeTake,
    }),
    prismadb.users.count({ where }),
  ]);

  return { users, total, hasMore: safeSkip + safeTake < total };
}
