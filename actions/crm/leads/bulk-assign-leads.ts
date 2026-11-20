"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, AuthenticationError } from "@/lib/authz";
import { filterAuthorizedLeadIds } from "@/lib/authz/scopes/crm";
import { writeAuditLog } from "@/lib/audit-log";
import { logOwnershipChange } from "@/lib/ownership";
import { resolveLeadDirectors } from "@/lib/lead-directors";
import { canBulkAssignToAreaDirector } from "@/lib/lead-assignment";

export type AreaDirectorOption = { id: string; name: string | null };

/** The active Area Directors who report to the current Regional Director (empty for anyone else). */
export async function getMyAreaDirectors(): Promise<AreaDirectorOption[]> {
  const session = await getSession();
  if (!session) return [];
  const me = await prismadb.users.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
  if (!me || me.role !== "regional_director") return [];
  return prismadb.users.findMany({
    where: { parentId: me.id, role: "area_director", userStatus: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

/**
 * Regional Director hands the selected leads to one of their own Area Directors.
 * Same attribution as a single reassignment: the AD becomes the owner and Area Director,
 * and the RD stays attributed as the Regional Director, so both share in the sale.
 */
export async function bulkAssignLeadsToAreaDirector(
  leadIds: string[],
  areaDirectorId: string,
  reason?: string,
) {
  if (!leadIds || leadIds.length === 0) return { error: "No leads selected" };
  if (!areaDirectorId) return { error: "Choose an Area Director" };

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
      where: { id: areaDirectorId },
      select: { id: true, role: true, parentId: true, userStatus: true },
    }),
  ]);
  if (!actor || !target) return { error: "Area Director not found" };
  if (!canBulkAssignToAreaDirector(actor, target) || target.userStatus !== "ACTIVE") {
    return { error: "You can only assign leads to the Area Directors who report to you." };
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

    const changeReason = reason?.trim() || "Bulk assignment to Area Director";
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
