"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";

export const GROUP_ASSIGNMENTS = [
  { id: "ALL_USERS", name: "👥 All Users (Everyone)", avatar: null },
  { id: "ALL_REGIONAL_DIRECTORS", name: "👔 All Regional Directors", avatar: null },
  { id: "ALL_AREA_DIRECTORS", name: "🏢 All Area Managers / Directors", avatar: null },
  { id: "ALL_CHANNEL_PARTNERS", name: "🤝 All Channel Partners", avatar: null },
];

export async function getUserById(userId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const group = GROUP_ASSIGNMENTS.find((g) => g.id === userId);
  if (group) {
    return { id: group.id, name: group.name, avatar: null };
  }

  const user = await prismadb.users.findFirst({
    where: { id: userId, userStatus: "ACTIVE" },
    select: { id: true, name: true, avatar: true },
  });

  return user ?? null;
}
