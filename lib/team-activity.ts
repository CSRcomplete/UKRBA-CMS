/**
 * Team Activity: a read-only feed, for the CEO / COO / admins, of the notes, calls,
 * meetings and emails that Regional and Area Directors log against leads.
 */
export const TEAM_ACTIVITY_VIEWER_ROLES = ["admin", "ceo", "coo"] as const;
export const TEAM_ACTIVITY_AUTHOR_ROLES = ["regional_director", "area_director"] as const;
export const ACTIVITY_TYPES = ["call", "meeting", "note", "email"] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type TeamActivityFilters = {
  type?: string;
  userId?: string;
  /** YYYY-MM-DD, inclusive */
  from?: string;
  /** YYYY-MM-DD, inclusive */
  to?: string;
};

export function canViewTeamActivity(role: string | null | undefined): boolean {
  return !!role && (TEAM_ACTIVITY_VIEWER_ROLES as readonly string[]).includes(role);
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Prisma `where` for the feed. Unknown or malformed filter values are ignored rather than trusted. */
export function buildTeamActivityWhere(filters: TeamActivityFilters = {}) {
  const where: Record<string, unknown> = {
    deletedAt: null,
    links: { some: { entityType: "lead" } },
    created_by_user: { role: { in: [...TEAM_ACTIVITY_AUTHOR_ROLES] } },
  };

  if (filters.type && (ACTIVITY_TYPES as readonly string[]).includes(filters.type)) {
    where.type = filters.type;
  }
  if (filters.userId && UUID_RE.test(filters.userId)) {
    where.createdBy = filters.userId;
  }

  const date: Record<string, Date> = {};
  if (filters.from && DATE_RE.test(filters.from)) {
    date.gte = new Date(`${filters.from}T00:00:00.000Z`);
  }
  if (filters.to && DATE_RE.test(filters.to)) {
    date.lte = new Date(`${filters.to}T23:59:59.999Z`);
  }
  if (Object.keys(date).length > 0) where.date = date;

  return where;
}
