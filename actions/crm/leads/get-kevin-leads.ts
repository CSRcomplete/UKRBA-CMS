"use server";

import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, AuthenticationError } from "@/lib/authz";
import { getLeads } from "@/actions/crm/get-leads";

const KEVIN_LEAD_TYPE = "Kevin Lead";

/** Roles that can see the Kevin Leads tab (Pete is COO, Shirley is admin). */
const KEVIN_LEADS_ROLES = ["admin", "ceo", "coo"];

/** All "Kevin Lead" leads, or null if the current user isn't allowed to see them. */
export async function getKevinLeads() {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return null;
    throw e;
  }
  if (!KEVIN_LEADS_ROLES.includes(user.role)) return null;

  const type = await prismadb.crm_Lead_Types.findUnique({ where: { name: KEVIN_LEAD_TYPE } });
  if (!type) return [];

  const all = await getLeads();
  return all.filter((l: any) => l.lead_type_id === type.id);
}
