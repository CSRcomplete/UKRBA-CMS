"use server";

import { prismadb } from "@/lib/prisma";
import { getLeads } from "@/actions/crm/get-leads";

const PLEDGE_LEAD_TYPE = "Pledge";

async function getPledgeTypeId(): Promise<string | null> {
  const type = await prismadb.crm_Lead_Types.findUnique({ where: { name: PLEDGE_LEAD_TYPE } });
  return type?.id ?? null;
}

/**
 * Every "Pledge" lead the current user is allowed to see. getLeads() is already scoped by
 * role (an RD only gets leads attributed to them or their team), so this only narrows it.
 */
export async function getPledgeLeads() {
  const typeId = await getPledgeTypeId();
  if (!typeId) return [];
  const all = await getLeads();
  return all.filter((l: any) => l.lead_type_id === typeId);
}
