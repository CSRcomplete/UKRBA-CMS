"use server";

import { prismadb } from "@/lib/prisma";
import { GROUP_ASSIGNMENTS, LEGACY_KEY_MAP } from "@/lib/constants/group-assignments";

export async function ensureGroupSystemUser(rawUserId: string): Promise<string> {
  const targetId = LEGACY_KEY_MAP[rawUserId] || rawUserId;
  const group = GROUP_ASSIGNMENTS.find((g) => g.id === targetId);

  if (!group) return targetId;

  const systemEmail = `group_${group.id}@system.local`;

  try {
    const existingById = await prismadb.users.findUnique({
      where: { id: group.id },
      select: { id: true },
    });
    if (existingById) return group.id;

    const existingByEmail = await prismadb.users.findFirst({
      where: { email: systemEmail },
      select: { id: true },
    });
    if (existingByEmail) return existingByEmail.id;

    await prismadb.users.create({
      data: {
        id: group.id,
        v: 0,
        email: systemEmail,
        name: group.name,
        userStatus: "ACTIVE",
      },
    });
  } catch {
    // Ignore concurrency or unique constraint errors
  }

  return targetId;
}
