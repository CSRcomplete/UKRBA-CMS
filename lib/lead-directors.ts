/**
 * Works out a lead's Area Director / Regional Director attribution when its owner changes.
 * Sales are attributed to these two fields, so a reassignment must never silently drop the RD.
 */
export type DirectorOwner = { id: string; role: string | null; parentId: string | null };
export type LeadDirectors = { areaDirectorId: string | null; regionalDirectorId: string | null };

export async function resolveLeadDirectors(
  newOwner: DirectorOwner,
  current: LeadDirectors,
  getParentId: (userId: string) => Promise<string | null>,
): Promise<LeadDirectors> {
  switch (newOwner.role) {
    case "user": {
      // A salesperson reports to an AD, whose parent is the RD.
      const areaDirectorId = newOwner.parentId;
      const regionalDirectorId = areaDirectorId ? await getParentId(areaDirectorId) : null;
      return { areaDirectorId, regionalDirectorId };
    }
    case "manager":
      return { areaDirectorId: newOwner.id, regionalDirectorId: newOwner.parentId };
    case "area_director":
      // The AD is attributed, and the RD above them. If that AD has no RD linked yet,
      // keep the lead's existing RD rather than losing it.
      return {
        areaDirectorId: newOwner.id,
        regionalDirectorId: newOwner.parentId ?? current.regionalDirectorId,
      };
    case "regional_director":
      return { areaDirectorId: null, regionalDirectorId: newOwner.id };
    default:
      // Roles outside the field hierarchy (admin, CEO, COO, ...): unchanged behaviour.
      return { areaDirectorId: null, regionalDirectorId: null };
  }
}
