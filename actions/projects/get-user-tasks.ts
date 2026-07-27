import { prismadb } from "@/lib/prisma";
import {
  requireAuthenticated,
  AuthenticationError,
} from "@/lib/authz";

export const getUserTasks = async (userId: string) => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    throw e;
  }

  // user role: only allowed to read own tasks.
  if (user.role === "user" && userId !== user.id) {
    return [];
  }

  const targetUserRecord = await prismadb.users.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const role = (targetUserRecord?.role || user.role || "").toLowerCase();

  const allowedGroupTargets: string[] = ["ALL_USERS"];
  if (role === "regional_director" || role === "admin" || role === "ceo") {
    allowedGroupTargets.push("ALL_REGIONAL_DIRECTORS");
  }
  if (role === "area_director" || role === "operations_director" || role === "admin" || role === "ceo") {
    allowedGroupTargets.push("ALL_AREA_DIRECTORS");
  }
  if (role === "channel_partner" || role === "admin" || role === "ceo") {
    allowedGroupTargets.push("ALL_CHANNEL_PARTNERS");
  }

  const data = await prismadb.tasks.findMany({
    where: {
      OR: [
        { user: userId },
        { user: { in: allowedGroupTargets } },
      ],
    },
    include: {
      assigned_user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return data;
};
