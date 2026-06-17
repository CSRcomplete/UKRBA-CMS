"use server";

import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireRole, AuthorizationError } from "@/lib/authz";
import { AppRole } from "@prisma/client";

export const updateUserManagement = async (
  userId: string,
  data: {
    role: AppRole;
    parentId: string | null;
    postcodeAreaIds: string[];
    channelPartnerIds: string[];
  }
) => {
  try {
    // Authorize requester
    await requireRole(["admin", "ceo", "operations_director"]);
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    return { error: "Unauthorized" };
  }

  if (!userId) return { error: "User ID is required" };

  try {
    await prismadb.$transaction(async (tx) => {
      // 1. Update the user role and supervisor parentId
      await tx.users.update({
        where: { id: userId },
        data: {
          role: data.role,
          parentId: data.parentId || null,
        },
      });

      // 2. Sync postcode routing assignments (PostcodeRoutingToAreaDirectors)
      // Delete existing assignments for this user
      await tx.postcodeRoutingToAreaDirectors.deleteMany({
        where: { area_director_id: userId },
      });

      // Insert new assignments if any
      if (data.postcodeAreaIds && data.postcodeAreaIds.length > 0) {
        await tx.postcodeRoutingToAreaDirectors.createMany({
          data: data.postcodeAreaIds.map((pcId) => ({
            postcode_routing_id: pcId,
            area_director_id: userId,
          })),
        });
      }

      // 3. Sync channel partner assignments
      // Clear parentId for channel partners that currently report to this user but are not in the new list
      await tx.users.updateMany({
        where: {
          parentId: userId,
          role: "channel_partner",
          id: { notIn: data.channelPartnerIds },
        },
        data: {
          parentId: null,
        },
      });

      // Set parentId to this user's ID for all newly selected channel partners
      if (data.channelPartnerIds && data.channelPartnerIds.length > 0) {
        await tx.users.updateMany({
          where: {
            id: { in: data.channelPartnerIds },
            role: "channel_partner",
          },
          data: {
            parentId: userId,
          },
        });
      }
    });

    revalidatePath("/[locale]/(routes)/admin/users", "page");
    revalidatePath(`/[locale]/(routes)/admin/users/${userId}`, "page");
    return { success: true };
  } catch (error: any) {
    console.error("[UPDATE_USER_MANAGEMENT_ERROR]", error);
    return { error: error.message || "Failed to update user management settings" };
  }
};
