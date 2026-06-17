import { prismadb } from "@/lib/prisma";
import { AuthzUser } from "../session";
import { AuthorizationError } from "../errors";

type ContactWhere = NonNullable<
  Parameters<typeof prismadb.crm_Contacts.updateMany>[0]
>["where"];
type TargetWhere = NonNullable<
  Parameters<typeof prismadb.crm_Targets.updateMany>[0]
>["where"];

// Recursive helper to get all direct and indirect subordinates for a user
async function getSubordinateUserIds(userId: string): Promise<string[]> {
  const subordinates: string[] = [];
  const queue = [userId];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = await prismadb.users.findMany({
      where: { parentId: currentId },
      select: { id: true },
    });
    const childIds = children.map((c) => c.id);
    subordinates.push(...childIds);
    queue.push(...childIds);
  }
  return subordinates;
}

// Helper to determine the list of user IDs a user is allowed to access
async function getAccessibleUserIds(user: AuthzUser): Promise<string[]> {
  const accessible = [user.id];
  if (user.role === "regional_director" || user.role === "area_director") {
    const subs = await getSubordinateUserIds(user.id);
    accessible.push(...subs);
  }
  return accessible;
}

async function contactScopedWhere(user: AuthzUser, contactId: string): Promise<ContactWhere> {
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    return { id: contactId };
  }
  const uids = await getAccessibleUserIds(user);
  return {
    id: contactId,
    OR: [
      { assigned_to: { in: uids } },
      { createdBy: { in: uids } },
    ],
  };
}

async function targetScopedWhere(user: AuthzUser, targetId: string): Promise<TargetWhere> {
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    return { id: targetId };
  }
  const uids = await getAccessibleUserIds(user);
  return { id: targetId, created_by: { in: uids } };
}

export async function tryScopedUpdateContact(
  user: AuthzUser,
  contactId: string,
  data: Record<string, string>,
): Promise<boolean> {
  const where = await contactScopedWhere(user, contactId);
  const result = await prismadb.crm_Contacts.updateMany({
    where,
    data: { ...data, updatedBy: user.id },
  });
  return result.count > 0;
}

export async function tryScopedUpdateTarget(
  user: AuthzUser,
  targetId: string,
  data: Record<string, string>,
): Promise<boolean> {
  const where = await targetScopedWhere(user, targetId);
  const result = await prismadb.crm_Targets.updateMany({
    where,
    data: { ...data, updatedBy: user.id },
  });
  return result.count > 0;
}

async function findContactInScope(user: AuthzUser, contactId: string) {
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    return prismadb.crm_Contacts.findFirst({
      where: { id: contactId },
      select: { id: true },
    });
  }
  const uids = await getAccessibleUserIds(user);
  return prismadb.crm_Contacts.findFirst({
    where: {
      id: contactId,
      OR: [
        { assigned_to: { in: uids } },
        { createdBy: { in: uids } },
      ],
    },
    select: { id: true },
  });
}

async function findTargetInScope(user: AuthzUser, targetId: string) {
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    return prismadb.crm_Targets.findFirst({
      where: { id: targetId },
      select: { id: true },
    });
  }
  const uids = await getAccessibleUserIds(user);
  return prismadb.crm_Targets.findFirst({
    where: { id: targetId, created_by: { in: uids } },
    select: { id: true },
  });
}

export async function assertCanReadContact(
  user: AuthzUser,
  contactId: string,
): Promise<void> {
  const readScope = await contactReadScopeWhere(user);
  const row = await prismadb.crm_Contacts.findFirst({
    where: { id: contactId, ...readScope },
    select: { id: true },
  });
  if (!row) throw new AuthorizationError();
}

export async function assertCanWriteContact(
  user: AuthzUser,
  contactId: string,
): Promise<void> {
  const row = await findContactInScope(user, contactId);
  if (!row) throw new AuthorizationError();
}

export async function assertCanReadTarget(
  user: AuthzUser,
  targetId: string,
): Promise<void> {
  const row = await findTargetInScope(user, targetId);
  if (!row) throw new AuthorizationError();
}

export async function assertCanWriteTarget(
  user: AuthzUser,
  targetId: string,
): Promise<void> {
  const row = await findTargetInScope(user, targetId);
  if (!row) throw new AuthorizationError();
}

export async function filterAuthorizedContactIds(
  user: AuthzUser,
  contactIds: string[],
): Promise<string[]> {
  if (contactIds.length === 0) return [];
  const readScope = await contactReadScopeWhere(user);
  const rows = await prismadb.crm_Contacts.findMany({
    where: { id: { in: contactIds }, ...readScope },
    select: { id: true },
  });
  return rows.map((r: { id: string }) => r.id);
}

export async function filterAuthorizedAccountIds(
  user: AuthzUser,
  accountIds: string[],
): Promise<string[]> {
  if (accountIds.length === 0) return [];
  const readScope = await accountReadScopeWhere(user);
  const rows = await prismadb.crm_Accounts.findMany({
    where: { id: { in: accountIds }, ...readScope },
    select: { id: true },
  });
  return rows.map((r: { id: string }) => r.id);
}

export async function filterAuthorizedLeadIds(
  user: AuthzUser,
  leadIds: string[],
): Promise<string[]> {
  if (leadIds.length === 0) return [];
  const readScope = await leadReadScopeWhere(user);
  const rows = await prismadb.crm_Leads.findMany({
    where: { id: { in: leadIds }, ...readScope },
    select: { id: true },
  });
  return rows.map((r: { id: string }) => r.id);
}

export async function filterAuthorizedOpportunityIds(
  user: AuthzUser,
  opportunityIds: string[],
): Promise<string[]> {
  if (opportunityIds.length === 0) return [];
  const readScope = await opportunityReadScopeWhere(user);
  const rows = await prismadb.crm_Opportunities.findMany({
    where: { id: { in: opportunityIds }, ...readScope },
    select: { id: true },
  });
  return rows.map((r: { id: string }) => r.id);
}

export async function assertCanCancelContactEnrichment(
  user: AuthzUser,
  enrichmentId: string,
): Promise<void> {
  const row = (await prismadb.crm_Contact_Enrichment.findUnique({
    where: { id: enrichmentId },
    select: { id: true, triggeredBy: true },
  })) as { id: string; triggeredBy: string | null } | null;
  if (!row) throw new AuthorizationError();
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  )
    return;
  if (row.triggeredBy !== user.id) throw new AuthorizationError();
}

export async function assertCanCancelTargetEnrichment(
  user: AuthzUser,
  enrichmentId: string,
): Promise<void> {
  const row = (await prismadb.crm_Target_Enrichment.findUnique({
    where: { id: enrichmentId },
    select: { id: true, triggeredBy: true },
  })) as { id: string; triggeredBy: string | null } | null;
  if (!row) throw new AuthorizationError();
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  )
    return;
  if (row.triggeredBy !== user.id) throw new AuthorizationError();
}

export async function filterAuthorizedTargetIds(
  user: AuthzUser,
  targetIds: string[],
): Promise<string[]> {
  if (targetIds.length === 0) return [];
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    const rows = await prismadb.crm_Targets.findMany({
      where: { id: { in: targetIds } },
      select: { id: true },
    });
    return rows.map((r: { id: string }) => r.id);
  }
  const uids = await getAccessibleUserIds(user);
  const rows = await prismadb.crm_Targets.findMany({
    where: { id: { in: targetIds }, created_by: { in: uids } },
    select: { id: true },
  });
  return rows.map((r: { id: string }) => r.id);
}

// Internal: the OR clauses describing user-level account ownership.
export function accountUserScopeOR(userId: string) {
  return [
    { assigned_to: userId },
    { createdBy: userId },
    { watchers: { some: { user_id: userId } } },
  ];
}

// Build a Prisma where for "this user can read this account".
export async function accountReadScopeWhere(user: AuthzUser) {
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    return { deletedAt: null };
  }
  const uids = await getAccessibleUserIds(user);
  return {
    deletedAt: null,
    OR: uids.flatMap((uid) => accountUserScopeOR(uid)),
  };
}

// Throws AuthorizationError if user can't read this account.
export async function assertCanReadAccount(
  user: AuthzUser,
  accountId: string,
): Promise<void> {
  const readScope = await accountReadScopeWhere(user);
  const row = await prismadb.crm_Accounts.findFirst({
    where: { id: accountId, ...readScope },
    select: { id: true },
  });
  if (!row) throw new AuthorizationError();
}

export async function assertCanWriteAccount(
  user: AuthzUser,
  accountId: string,
): Promise<void> {
  let where;
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    where = { id: accountId };
  } else {
    const uids = await getAccessibleUserIds(user);
    where = {
      id: accountId,
      OR: uids.flatMap((uid) => accountUserScopeOR(uid)),
    };
  }
  const row = await prismadb.crm_Accounts.findFirst({
    where,
    select: { id: true },
  });
  if (!row) throw new AuthorizationError();
}

// crm_Leads → crm_Accounts via `assigned_accounts` (FK accountsIDs).
export async function leadReadScopeWhere(user: AuthzUser) {
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    return { deletedAt: null };
  }
  const uids = await getAccessibleUserIds(user);
  return {
    deletedAt: null,
    OR: [
      { assigned_to: { in: uids } },
      { createdBy: { in: uids } },
      { assigned_accounts: { OR: uids.flatMap((uid) => accountUserScopeOR(uid)) } },
    ],
  };
}

// crm_Contacts → crm_Accounts via `assigned_accounts` (FK accountsIDs).
export async function contactReadScopeWhere(user: AuthzUser) {
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    return { deletedAt: null };
  }
  const uids = await getAccessibleUserIds(user);
  return {
    deletedAt: null,
    OR: [
      { assigned_to: { in: uids } },
      { createdBy: { in: uids } },
      { assigned_accounts: { OR: uids.flatMap((uid) => accountUserScopeOR(uid)) } },
    ],
  };
}

// crm_Opportunities → crm_Accounts via `assigned_account` (FK account).
export async function opportunityReadScopeWhere(user: AuthzUser) {
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    return { deletedAt: null };
  }
  const uids = await getAccessibleUserIds(user);
  return {
    deletedAt: null,
    OR: [
      { assigned_to: { in: uids } },
      { createdBy: { in: uids } },
      { assigned_account: { OR: uids.flatMap((uid) => accountUserScopeOR(uid)) } },
    ],
  };
}

// crm_Contracts → crm_Accounts via `assigned_account` (FK account).
export async function contractReadScopeWhere(user: AuthzUser) {
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    return { deletedAt: null };
  }
  const uids = await getAccessibleUserIds(user);
  return {
    deletedAt: null,
    OR: [
      { assigned_to: { in: uids } },
      { createdBy: { in: uids } },
      { assigned_account: { OR: uids.flatMap((uid) => accountUserScopeOR(uid)) } },
    ],
  };
}

export async function assertCanReadLead(
  user: AuthzUser,
  leadId: string,
): Promise<void> {
  const readScope = await leadReadScopeWhere(user);
  const row = await prismadb.crm_Leads.findFirst({
    where: { id: leadId, ...readScope },
    select: { id: true },
  });
  if (!row) throw new AuthorizationError();
}

export async function assertCanReadOpportunity(
  user: AuthzUser,
  opportunityId: string,
): Promise<void> {
  const readScope = await opportunityReadScopeWhere(user);
  const row = await prismadb.crm_Opportunities.findFirst({
    where: { id: opportunityId, ...readScope },
    select: { id: true },
  });
  if (!row) throw new AuthorizationError();
}

export async function assertCanReadContract(
  user: AuthzUser,
  contractId: string,
): Promise<void> {
  const readScope = await contractReadScopeWhere(user);
  const row = await prismadb.crm_Contracts.findFirst({
    where: { id: contractId, ...readScope },
    select: { id: true },
  });
  if (!row) throw new AuthorizationError();
}

export async function targetReadScopeWhere(user: AuthzUser) {
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    return { deletedAt: null };
  }
  const uids = await getAccessibleUserIds(user);
  return { deletedAt: null, created_by: { in: uids } };
}

export async function targetListReadScopeWhere(user: AuthzUser) {
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    return { deletedAt: null };
  }
  const uids = await getAccessibleUserIds(user);
  return { deletedAt: null, created_by: { in: uids } };
}

export async function assertCanReadTargetList(
  user: AuthzUser,
  listId: string,
): Promise<void> {
  const readScope = await targetListReadScopeWhere(user);
  const row = await prismadb.crm_TargetLists.findFirst({
    where: { id: listId, ...readScope },
    select: { id: true },
  });
  if (!row) throw new AuthorizationError();
}

export async function documentReadScopeWhere(user: AuthzUser) {
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    return { deletedAt: null };
  }
  const uids = await getAccessibleUserIds(user);
  return {
    deletedAt: null,
    OR: [
      { created_by_user: { in: uids } },
      { createdBy: { in: uids } },
      { assigned_user: { in: uids } },
      { visibility: "public" },
      { accounts: { some: { account: { OR: uids.flatMap((uid) => accountUserScopeOR(uid)) } } } },
      {
        leads: {
          some: {
            lead: {
              OR: [
                { assigned_to: { in: uids } },
                { createdBy: { in: uids } },
              ],
            },
          },
        },
      },
      {
        contacts: {
          some: {
            contact: {
              OR: [
                { assigned_to: { in: uids } },
                { createdBy: { in: uids } },
              ],
            },
          },
        },
      },
      {
        opportunities: {
          some: {
            opportunity: {
              OR: [
                { assigned_to: { in: uids } },
                { createdBy: { in: uids } },
              ],
            },
          },
        },
      },
    ],
  };
}

export async function assertCanReadDocument(
  user: AuthzUser,
  documentId: string,
): Promise<void> {
  const readScope = await documentReadScopeWhere(user);
  const row = await prismadb.documents.findFirst({
    where: { id: documentId, ...readScope },
    select: { id: true },
  });
  if (!row) throw new AuthorizationError();
}

export async function assertCanWriteDocument(
  user: AuthzUser,
  documentId: string,
): Promise<void> {
  return assertCanReadDocument(user, documentId);
}

export async function filterAuthorizedDocumentIds(
  user: AuthzUser,
  documentIds: string[],
): Promise<string[]> {
  if (documentIds.length === 0) return [];
  const readScope = await documentReadScopeWhere(user);
  const rows = await prismadb.documents.findMany({
    where: { id: { in: documentIds }, ...readScope },
    select: { id: true },
  });
  return rows.map((r: { id: string }) => r.id);
}

export async function assertCanReadActivityForEntity(
  user: AuthzUser,
  entityType: string,
  entityId: string,
): Promise<void> {
  switch (entityType.toLowerCase()) {
    case "account":
      return assertCanReadAccount(user, entityId);
    case "lead":
      return assertCanReadLead(user, entityId);
    case "contact":
      return assertCanReadContact(user, entityId);
    case "opportunity":
      return assertCanReadOpportunity(user, entityId);
    case "contract":
      return assertCanReadContract(user, entityId);
    case "target":
      return assertCanReadTarget(user, entityId);
    case "target_list":
    case "targetlist":
      return assertCanReadTargetList(user, entityId);
    default:
      if (user.role === "user") throw new AuthorizationError();
      return;
  }
}

export async function campaignReadScopeWhere(user: AuthzUser) {
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    return { status: { not: "deleted" } };
  }
  const uids = await getAccessibleUserIds(user);
  return { status: { not: "deleted" }, created_by: { in: uids } };
}

export async function campaignTemplateReadScopeWhere(user: AuthzUser) {
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    return { deletedAt: null };
  }
  const uids = await getAccessibleUserIds(user);
  return { deletedAt: null, created_by: { in: uids } };
}

export async function assertCanReadCampaign(
  user: AuthzUser,
  id: string,
): Promise<void> {
  const readScope = await campaignReadScopeWhere(user);
  const row = await prismadb.crm_campaigns.findFirst({
    where: { id, ...readScope },
    select: { id: true },
  });
  if (!row) throw new AuthorizationError();
}

export async function assertCanWriteCampaign(
  user: AuthzUser,
  id: string,
): Promise<void> {
  return assertCanReadCampaign(user, id);
}

export async function assertCanReadTemplate(
  user: AuthzUser,
  id: string,
): Promise<void> {
  const readScope = await campaignTemplateReadScopeWhere(user);
  const row = await prismadb.crm_campaign_templates.findFirst({
    where: { id, ...readScope },
    select: { id: true },
  });
  if (!row) throw new AuthorizationError();
}

export async function assertCanWriteTemplate(
  user: AuthzUser,
  id: string,
): Promise<void> {
  return assertCanReadTemplate(user, id);
}

export async function boardReadScopeWhere(user: AuthzUser) {
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    return { deletedAt: null };
  }
  const uids = await getAccessibleUserIds(user);
  return {
    deletedAt: null,
    OR: [
      { user: { in: uids } },
      { sharedWith: { hasSome: uids } },
      { visibility: "public" },
      { watchers: { some: { user_id: { in: uids } } } },
    ],
  };
}

export async function boardWriteScopeWhere(user: AuthzUser) {
  if (
    user.role === "admin" ||
    user.role === "ceo" ||
    user.role === "operations_director" ||
    user.role === "manager"
  ) {
    return { deletedAt: null };
  }
  const uids = await getAccessibleUserIds(user);
  return { deletedAt: null, user: { in: uids } };
}

export async function assertCanReadBoard(
  user: AuthzUser,
  boardId: string,
): Promise<void> {
  const readScope = await boardReadScopeWhere(user);
  const row = await prismadb.boards.findFirst({
    where: { id: boardId, ...readScope },
    select: { id: true },
  });
  if (!row) throw new AuthorizationError();
}

export async function assertCanWriteBoard(
  user: AuthzUser,
  boardId: string,
): Promise<void> {
  const writeScope = await boardWriteScopeWhere(user);
  const row = await prismadb.boards.findFirst({
    where: { id: boardId, ...writeScope },
    select: { id: true },
  });
  if (!row) throw new AuthorizationError();
}

export async function assertCanReadTask(
  user: AuthzUser,
  taskId: string,
): Promise<void> {
  const task = await prismadb.tasks.findUnique({
    where: { id: taskId },
    select: {
      assigned_section: {
        select: { board_relation: { select: { id: true } } },
      },
    },
  });
  const boardId = task?.assigned_section?.board_relation?.id;
  if (!boardId) throw new AuthorizationError();
  return assertCanReadBoard(user, boardId);
}

export async function assertCanWriteTask(
  user: AuthzUser,
  taskId: string,
): Promise<void> {
  const task = await prismadb.tasks.findUnique({
    where: { id: taskId },
    select: {
      user: true,
      assigned_section: {
        select: { board_relation: { select: { id: true } } },
      },
    },
  });
  const boardId = task?.assigned_section?.board_relation?.id;
  if (!boardId) throw new AuthorizationError();
  const uids = await getAccessibleUserIds(user);
  if (task?.user && uids.includes(task.user)) return;
  return assertCanWriteBoard(user, boardId);
}
