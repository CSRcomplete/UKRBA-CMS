"use server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole, AuthorizationError } from "@/lib/authz";

export const updateUserHierarchy = async (
  userId: string,
  parentId: string | null,
  regionId: number | null,
  areaId: number | null
) => {
  let actor;
  try {
    actor = await requireRole(["admin", "ceo", "operations_director"]);
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    return { error: "Unauthorized" };
  }

  if (!userId) return { error: "userId is required" };

  try {
    const user = await prismadb.users.update({
      where: { id: userId },
      data: {
        parentId: parentId || null,
        region_id: regionId || null,
        area_id: areaId || null,
      },
    });
    revalidatePath("/[locale]/(routes)/admin", "page");
    return { data: user };
  } catch (error) {
    console.log("[UPDATE_USER_HIERARCHY]", error);
    return { error: "Failed to update user hierarchy details" };
  }
};
