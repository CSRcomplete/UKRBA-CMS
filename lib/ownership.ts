import { prismadb } from "./prisma";

export interface OwnershipChangeParams {
  entityType: "lead" | "member";
  entityId: string;
  previousOwnerId?: string | null;
  newOwnerId?: string | null;
  areaDirectorId?: string | null;
  regionalDirectorId?: string | null;
  changedById?: string | null;
  changeReason?: string | null;
}

export async function logOwnershipChange(params: OwnershipChangeParams) {
  return await prismadb.crm_Ownership_History.create({
    data: {
      entity_type: params.entityType,
      entity_id: params.entityId,
      previous_owner_id: params.previousOwnerId || null,
      new_owner_id: params.newOwnerId || null,
      area_director_id: params.areaDirectorId || null,
      regional_director_id: params.regionalDirectorId || null,
      changed_by_id: params.changedById || null,
      change_reason: params.changeReason || null,
    },
  });
}

export async function getOwnershipHistory(entityType: "lead" | "member", entityId: string) {
  const history = await prismadb.crm_Ownership_History.findMany({
    where: {
      entity_type: entityType,
      entity_id: entityId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Extract all user IDs
  const userIds = new Set<string>();
  history.forEach((h) => {
    if (h.previous_owner_id) userIds.add(h.previous_owner_id);
    if (h.new_owner_id) userIds.add(h.new_owner_id);
    if (h.area_director_id) userIds.add(h.area_director_id);
    if (h.regional_director_id) userIds.add(h.regional_director_id);
    if (h.changed_by_id) userIds.add(h.changed_by_id);
  });

  const users = await prismadb.users.findMany({
    where: {
      id: { in: Array.from(userIds) },
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  });

  const userMap = new Map(users.map((u) => [u.id, u]));

  return history.map((h) => ({
    ...h,
    previous_owner: h.previous_owner_id ? userMap.get(h.previous_owner_id) : null,
    new_owner: h.new_owner_id ? userMap.get(h.new_owner_id) : null,
    area_director: h.area_director_id ? userMap.get(h.area_director_id) : null,
    regional_director: h.regional_director_id ? userMap.get(h.regional_director_id) : null,
    changed_by_user: h.changed_by_id ? userMap.get(h.changed_by_id) : null,
  }));
}
