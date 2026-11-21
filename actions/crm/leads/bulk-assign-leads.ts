"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, AuthenticationError } from "@/lib/authz";
import { filterAuthorizedLeadIds } from "@/lib/authz/scopes/crm";
import { writeAuditLog } from "@/lib/audit-log";
import { logOwnershipChange } from "@/lib/ownership";
import { resolveLeadDirectors } from "@/lib/lead-directors";
import { canBulkAssign, BULK_ASSIGN_ADMIN_ROLES } from "@/lib/lead-assignment";

export type BulkAssignTarget = { id: string; name: string | null; role: string | null };

/**
 * Who the current user may bulk assign to: a Regional Director gets their own active
 * Area Directors; admin / CEO / COO get every active Regional and Area Director.
 * Empty for anyone else.
 */
export async function getBulkAssignTargets(): Promise<BulkAssignTarget[]> {
  const session = await getSession();
  if (!session) return [];
  const me = await prismadb.users.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!me) return [];

  if (me.role === "regional_director") {
    return prismadb.users.findMany({
      where: { parentId: me.id, role: "area_director", userStatus: "ACTIVE" },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    });
  }
  if (me.role && (BULK_ASSIGN_ADMIN_ROLES as readonly string[]).includes(me.role)) {
    return prismadb.users.findMany({
      where: { role: { in: ["regional_director", "area_director"] }, userStatus: "ACTIVE" },
      select: { id: true, name: true, role: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
  }
  return [];
}

/**
 * Hand the selected leads to one Regional or Area Director (who may be chosen depends on the
 * caller, see canBulkAssign). Same attribution as a single reassignment: an AD becomes the owner
 * and Area Director with their RD staying attributed as Regional Director, so both share in the
 * sale; an RD becomes the owner and Regional Director.
 */
export async function bulkAssignLeads(
  leadIds: string[],
  assigneeId: string,
  reason?: string,
) {
  if (!leadIds || leadIds.length === 0) return { error: "No leads selected" };
  if (!assigneeId) return { error: "Choose who to assign the leads to" };

  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    throw e;
  }

  const [actor, target] = await Promise.all([
    prismadb.users.findUnique({ where: { id: user.id }, select: { id: true, role: true } }),
    prismadb.users.findUnique({
      where: { id: assigneeId },
      select: { id: true, role: true, parentId: true, userStatus: true },
    }),
  ]);
  if (!actor || !target) return { error: "Assignee not found" };
  if (!canBulkAssign(actor, target) || target.userStatus !== "ACTIVE") {
    return {
      error:
        actor.role === "regional_director"
          ? "You can only assign leads to the Area Directors who report to you."
          : "Leads can only be assigned to an active Regional or Area Director.",
    };
  }

  // Every selected lead must be one this user can already see.
  const allowedIds = await filterAuthorizedLeadIds(user, leadIds);
  if (allowedIds.length !== new Set(leadIds).size) {
    return { error: "Some of the selected leads are outside your access." };
  }

  try {
    const leads = await prismadb.crm_Leads.findMany({
      where: { id: { in: allowedIds }, deletedAt: null },
      select: {
        id: true,
        assigned_to: true,
        assigned_area_director_id: true,
        assigned_regional_director_id: true,
      },
    });
    const toChange = leads.filter((l) => l.assigned_to !== target.id);

    const directors = await resolveLeadDirectors(
      { id: target.id, role: target.role, parentId: target.parentId },
      { areaDirectorId: null, regionalDirectorId: null },
      async () => null,
    );

    await prismadb.$transaction(
      toChange.map((lead) =>
        prismadb.crm_Leads.update({
          where: { id: lead.id },
          data: {
            assigned_to: target.id,
            assigned_area_director_id: directors.areaDirectorId,
            assigned_regional_director_id: directors.regionalDirectorId,
            updatedBy: user.id,
          },
        }),
      ),
    );

    const changeReason = reason?.trim() || "Bulk assignment";
    await Promise.allSettled(
      toChange.flatMap((lead) => [
        logOwnershipChange({
          entityType: "lead",
          entityId: lead.id,
          previousOwnerId: lead.assigned_to,
          newOwnerId: target.id,
          areaDirectorId: directors.areaDirectorId,
          regionalDirectorId: directors.regionalDirectorId,
          changedById: user.id,
          changeReason,
        }),
        writeAuditLog({
          entityType: "lead",
          entityId: lead.id,
          action: "updated",
          changes: null,
          userId: user.id,
        }),
      ]),
    );

    revalidatePath("/[locale]/(routes)/crm/leads", "page");
    return { success: true, assigned: toChange.length, alreadyAssigned: leads.length - toChange.length };
  } catch (error) {
    console.log("[BULK_ASSIGN_LEADS]", error);
    return { error: "Failed to assign leads" };
  }
}
