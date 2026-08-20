import { prismadb } from "@/lib/prisma";
import {
  requireAuthenticated,
  getAccessibleUserIds,
  AuthenticationError,
} from "@/lib/authz";
import { GROUP_TARGET_UUIDS } from "@/lib/constants/group-assignments";

// Roles with unrestricted visibility into any user's tasks, matching the
// same tier already used for contacts/targets elsewhere in this app.
const FULL_TASK_ACCESS_ROLES = ["admin", "ceo", "coo", "operations_director", "manager"];

export const getUserTasks = async (userId: string) => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    throw e;
  }

  // Everyone below the full-access tier may only view their own tasks or
  // those of staff they supervise — this route previously let a Regional
  // Director, Area Director, or Channel Partner load any other user's
  // tasks just by knowing their user ID.
  if (!FULL_TASK_ACCESS_ROLES.includes(user.role)) {
    const accessibleUserIds = await getAccessibleUserIds(user);
    if (!accessibleUserIds.includes(userId)) {
      return [];
    }
  }

  const targetUserRecord = await prismadb.users.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const role = (targetUserRecord?.role || user.role || "").toLowerCase();

  // Tasks.user is a strict uuid column, so only the real GROUP_TARGET_UUIDS
  // values can ever match; the legacy plain-string keys (e.g. "ALL_USERS")
  // predate that column being a uuid and can never actually be stored
  // there, only ever break the query.
  const allowedGroupTargets: string[] = [GROUP_TARGET_UUIDS.ALL_USERS];
  if (role === "regional_director" || role === "admin" || role === "ceo" || role === "coo") {
    allowedGroupTargets.push(GROUP_TARGET_UUIDS.ALL_REGIONAL_DIRECTORS);
  }
  if (role === "area_director" || role === "operations_director" || role === "admin" || role === "ceo" || role === "coo") {
    allowedGroupTargets.push(GROUP_TARGET_UUIDS.ALL_AREA_DIRECTORS);
  }
  if (role === "channel_partner" || role === "admin" || role === "ceo" || role === "coo") {
    allowedGroupTargets.push(GROUP_TARGET_UUIDS.ALL_CHANNEL_PARTNERS);
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
