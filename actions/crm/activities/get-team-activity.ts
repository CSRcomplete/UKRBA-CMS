"use server";

import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, AuthenticationError } from "@/lib/authz";
import {
  buildTeamActivityWhere,
  canViewTeamActivity,
  TEAM_ACTIVITY_AUTHOR_ROLES,
  type TeamActivityFilters,
} from "@/lib/team-activity";

const PAGE_SIZE = 30;

export type TeamActivityEntry = {
  id: string;
  type: "call" | "meeting" | "note" | "email";
  title: string;
  description: string | null;
  outcome: string | null;
  status: "scheduled" | "completed" | "cancelled";
  date: Date;
  createdBy: { id: string; name: string | null; role: string | null } | null;
  lead: { id: string; name: string; company: string | null } | null;
};

export type TeamActivityCursor = { date: string; id: string };

/** Who the current user is, or null when they may not use Team Activity. */
async function getViewer() {
  try {
    const user = await requireAuthenticated();
    return canViewTeamActivity(user.role) ? user : null;
  } catch (e) {
    if (e instanceof AuthenticationError) return null;
    throw e;
  }
}

/**
 * Notes, calls, meetings and emails that RDs and ADs have logged on leads, newest first.
 * Returns null when the current user is not an admin / CEO / COO.
 */
export async function getTeamActivity(
  filters: TeamActivityFilters = {},
  cursor?: TeamActivityCursor,
): Promise<{ data: TeamActivityEntry[]; nextCursor: TeamActivityCursor | null } | null> {
  if (!(await getViewer())) return null;

  const and: Record<string, unknown>[] = [buildTeamActivityWhere(filters)];
  if (cursor) {
    const date = new Date(cursor.date);
    if (!Number.isNaN(date.getTime())) {
      and.push({ OR: [{ date: { lt: date } }, { date, id: { lt: cursor.id } }] });
    }
  }

  // Same `as any` pattern as the other activity actions (these models are newer than the cached client types).
  const rows: any[] = await (prismadb as any).crm_Activities.findMany({
    where: { AND: and },
    orderBy: [{ date: "desc" }, { id: "desc" }],
    take: PAGE_SIZE,
    include: {
      created_by_user: { select: { id: true, name: true, role: true } },
      links: { where: { entityType: "lead" }, select: { entityId: true } },
    },
  });

  const leadIds = Array.from(new Set(rows.flatMap((r) => r.links.map((l: any) => l.entityId)))) as string[];
  const leads = leadIds.length
    ? await prismadb.crm_Leads.findMany({
        where: { id: { in: leadIds } },
        select: { id: true, firstName: true, lastName: true, company: true },
      })
    : [];
  const leadById = new Map(leads.map((l) => [l.id, l]));

  const data: TeamActivityEntry[] = rows.map((r) => {
    const lead = leadById.get(r.links[0]?.entityId);
    return {
      id: r.id,
      type: r.type,
      title: r.title,
      description: r.description,
      outcome: r.outcome,
      status: r.status,
      date: r.date,
      createdBy: r.created_by_user,
      lead: lead
        ? {
            id: lead.id,
            name: [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Lead",
            company: lead.company,
          }
        : null,
    };
  });

  const last = rows[rows.length - 1];
  const nextCursor =
    rows.length < PAGE_SIZE ? null : { date: last.date.toISOString(), id: last.id };
  return { data, nextCursor };
}

/** Active RDs and ADs, for the "person" filter. Empty unless the user may use Team Activity. */
export async function getTeamActivityAuthors(): Promise<
  { id: string; name: string | null; role: string | null }[]
> {
  if (!(await getViewer())) return [];
  return prismadb.users.findMany({
    where: { role: { in: [...TEAM_ACTIVITY_AUTHOR_ROLES] }, userStatus: "ACTIVE" },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}

export async function canViewTeamActivityPage(): Promise<boolean> {
  return (await getViewer()) !== null;
}
