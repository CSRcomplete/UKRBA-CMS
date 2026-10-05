"use server";

import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, AuthenticationError } from "@/lib/authz";
import { getSubordinateUserIds } from "@/lib/authz/scopes/crm";
import { getLeads } from "@/actions/crm/get-leads";

export type DirectReport = {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
  leadCount: number;
};

const SUPERVISOR_ROLES = ["regional_director", "area_director"];

/** Whether the current user is an RD/AD and should see the My Leads / Team Leads gateway. */
export async function isTeamSupervisor(): Promise<boolean> {
  try {
    const user = await requireAuthenticated();
    return SUPERVISOR_ROLES.includes(user.role);
  } catch (e) {
    if (e instanceof AuthenticationError) return false;
    throw e;
  }
}

/** The current user's direct reports (one level down only — not their whole subtree), with a lead count each. */
export async function getDirectReports(): Promise<DirectReport[]> {
  const user = await requireAuthenticated();
  if (!SUPERVISOR_ROLES.includes(user.role)) return [];

  const reports = await prismadb.users.findMany({
    where: { parentId: user.id, userStatus: "ACTIVE" },
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });

  const counts = await Promise.all(
    reports.map(async (r) => {
      const ids = [r.id, ...(await getSubordinateUserIds(r.id))];
      return prismadb.crm_Leads.count({
        where: { deletedAt: null, assigned_to: { in: ids } },
      });
    })
  );

  return reports.map((r, i) => ({ ...r, leadCount: counts[i] }));
}

/** All leads visible to the current user, filtered to only their own directly-assigned ones. */
export async function getMyLeads() {
  const user = await requireAuthenticated();
  const all = await getLeads();
  return all.filter((l: any) => l.assigned_to === user.id);
}

/**
 * All leads visible to the current user, filtered to one specific person
 * they supervise (that person's own assignments plus anyone under them).
 * Returns null if the target isn't actually someone the current user
 * supervises — getLeads() is already scoped to what the viewer can see,
 * so this can only ever narrow that, never expose anything extra, but the
 * explicit check keeps the "not your report" case an honest empty result
 * rather than a silently-empty list that looks like "no leads".
 */
export async function getTeamMemberLeads(targetUserId: string) {
  const user = await requireAuthenticated();
  if (!SUPERVISOR_ROLES.includes(user.role)) return null;

  const mySubtree = await getSubordinateUserIds(user.id);
  if (!mySubtree.includes(targetUserId)) return null;

  const targetIds = [targetUserId, ...(await getSubordinateUserIds(targetUserId))];
  const all = await getLeads();
  return all.filter((l: any) => targetIds.includes(l.assigned_to));
}
