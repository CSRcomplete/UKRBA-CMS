import { prismadb } from "@/lib/prisma";

export const GROUP_ASSIGNMENTS = [
  { id: "00000000-0000-0000-0000-000000000001", name: "👥 All Users (Everyone)", avatar: null },
  { id: "00000000-0000-0000-0000-000000000002", name: "👔 All Regional Directors", avatar: null },
  { id: "00000000-0000-0000-0000-000000000003", name: "🏢 All Area Managers", avatar: null },
  { id: "00000000-0000-0000-0000-000000000004", name: "🤝 All Channel Partners", avatar: null },
];

export const GROUP_TARGET_UUIDS = {
  ALL_USERS: "00000000-0000-0000-0000-000000000001",
  ALL_REGIONAL_DIRECTORS: "00000000-0000-0000-0000-000000000002",
  ALL_AREA_DIRECTORS: "00000000-0000-0000-0000-000000000003",
  ALL_CHANNEL_PARTNERS: "00000000-0000-0000-0000-000000000004",
};

export const LEGACY_KEY_MAP: Record<string, string> = {
  ALL_USERS: "00000000-0000-0000-0000-000000000001",
  ALL_REGIONAL_DIRECTORS: "00000000-0000-0000-0000-000000000002",
  ALL_AREA_DIRECTORS: "00000000-0000-0000-0000-000000000003",
  ALL_CHANNEL_PARTNERS: "00000000-0000-0000-0000-000000000004",
};

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
