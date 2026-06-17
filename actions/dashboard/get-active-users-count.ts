import { prismadb } from "@/lib/prisma";
import { requireAuthenticated } from "@/lib/authz";

export const getActiveUsersCount = async () => {
  const user = await requireAuthenticated();

  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    return prismadb.users.count({
      where: {
        userStatus: "ACTIVE",
      },
    });
  }

  if (user.role === "regional_director") {
    if (!user.region_id) return 0;
    return prismadb.users.count({
      where: {
        userStatus: "ACTIVE",
        region_id: user.region_id,
        id: { not: user.id },
      },
    });
  }

  if (user.role === "area_director") {
    if (!user.area_id) return 0;
    return prismadb.users.count({
      where: {
        userStatus: "ACTIVE",
        area_id: user.area_id,
        id: { not: user.id },
      },
    });
  }

  // Channel partners or standard users do not manage other users
  return 0;
};
