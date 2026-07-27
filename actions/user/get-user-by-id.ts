"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { GROUP_ASSIGNMENTS } from "@/lib/constants/group-assignments";

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
