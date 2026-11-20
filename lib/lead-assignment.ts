/**
 * Who a user may hand a lead to.
 *
 * A Regional Director may only assign a lead to themselves or to an Area Director
 * who reports to them (users.parentId = the RD). Every other role is unchanged:
 * admin / CEO / COO and the rest of the existing behaviour are not restricted here.
 */
export type LeadActor = { id: string; role: string | null };
export type LeadAssignee = { id: string; role: string | null; parentId: string | null };

export const RD_ASSIGN_ERROR =
  "Regional Directors can only assign leads to themselves or to the Area Directors who report to them.";

export function canAssignLeadTo(actor: LeadActor, target: LeadAssignee): boolean {
  if (actor.role !== "regional_director") return true;
  if (target.id === actor.id) return true;
  return target.role === "area_director" && target.parentId === actor.id;
}

/**
 * Bulk assignment is for Regional Directors handing leads down to the Area Directors
 * who report to them (not to themselves, other RDs, or anyone else).
 */
export function canBulkAssignToAreaDirector(actor: LeadActor, target: LeadAssignee): boolean {
  return (
    actor.role === "regional_director" &&
    target.role === "area_director" &&
    target.parentId === actor.id
  );
}

/** Prisma `where` limiting the owner picker for this actor, or null when unrestricted. */
export function leadAssigneeWhere(actor: LeadActor) {
  if (actor.role !== "regional_director") return null;
  return {
    OR: [
      { id: actor.id },
      { role: "area_director" as const, parentId: actor.id },
    ],
  };
}
