import type { AuthzUser } from "@/lib/authz";
import { isAdmin } from "@/lib/authz";

export function canManageLeadSalesStatus(
  user: AuthzUser,
  lead: {
    assigned_to?: string | null;
    assigned_partner_id?: string | null;
    assigned_area_director_id?: string | null;
    assigned_regional_director_id?: string | null;
  }
): boolean {
  if (isAdmin(user)) return true;
  return [lead.assigned_to, lead.assigned_partner_id, lead.assigned_area_director_id, lead.assigned_regional_director_id]
    .filter(Boolean)
    .includes(user.id);
}
