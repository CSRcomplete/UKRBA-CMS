"use server";
import { prismadb } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";

export const getHierarchyOptions = async () => {
  await requireRole(["admin", "ceo", "coo", "operations_director"]);
  const users = await prismadb.users.findMany({
    where: {
      userStatus: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      role: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  });
  return users;
};
