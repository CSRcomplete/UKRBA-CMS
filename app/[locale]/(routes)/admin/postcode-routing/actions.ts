"use server";

import { prismadb } from "@/lib/prisma";
import { requireRole } from "@/lib/authz";
import { revalidatePath } from "next/cache";

export async function getPostcodeRoutes() {
  const actor = await requireRole(["admin", "ceo", "operations_director", "regional_director"]);
  
  if (actor.role === "regional_director" && actor.region_id !== null) {
    return await prismadb.nextcrm_postcode_routing.findMany({
      where: {
        assigned_region_id: actor.region_id,
      },
      include: {
        area_directors: {
          include: {
            area_director: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      },
      orderBy: {
        postcode_area: "asc",
      },
    });
  }

  return await prismadb.nextcrm_postcode_routing.findMany({
    include: {
      area_directors: {
        include: {
          area_director: {
            select: { id: true, name: true, email: true }
          }
        }
      }
    },
    orderBy: {
      postcode_area: "asc",
    },
  });
}

export async function createPostcodeRoute(data: {
  postcode_area: string;
  area_name?: string | null;
  region_country: string;
  assigned_region_id: number;
  area_director_ids?: string[];
}) {
  const actor = await requireRole(["admin", "ceo", "operations_director"]);

  const { postcode_area, area_name, region_country, assigned_region_id, area_director_ids } = data;
  const cleanArea = postcode_area.trim().toUpperCase();

  if (!cleanArea || !region_country || !assigned_region_id) {
    return { error: "Missing required fields" };
  }

  try {
    const existing = await prismadb.nextcrm_postcode_routing.findUnique({
      where: { postcode_area: cleanArea },
    });

    if (existing) {
      return { error: "Postcode area rule already exists" };
    }

    const newRoute = await prismadb.nextcrm_postcode_routing.create({
      data: {
        postcode_area: cleanArea,
        area_name: area_name || null,
        region_country,
        assigned_region_id: Number(assigned_region_id),
      },
    });

    // Create many-to-many assignments
    if (area_director_ids && area_director_ids.length > 0) {
      await prismadb.postcodeRoutingToAreaDirectors.createMany({
        data: area_director_ids.map((adId) => ({
          postcode_routing_id: newRoute.id,
          area_director_id: adId,
        }))
      });
    }

    // Log to audit log
    await prismadb.sys_audit_logs.create({
      data: {
        entity_type: "nextcrm_postcode_routing",
        entity_id: newRoute.id,
        field_mutated: "ALL",
        new_value: JSON.stringify(newRoute),
      },
    });

    revalidatePath("/[locale]/(routes)/admin/postcode-routing", "page");
    return { success: true, route: newRoute };
  } catch (error) {
    console.error("[CREATE_POSTCODE_ROUTE_ERROR]", error);
    return { error: "Failed to create postcode routing rule" };
  }
}

export async function updatePostcodeRoute(
  id: string,
  data: {
    postcode_area: string;
    area_name?: string | null;
    region_country: string;
    assigned_region_id: number;
    area_director_ids?: string[];
  }
) {
  const actor = await requireRole(["admin", "ceo", "operations_director", "regional_director"]);

  const { postcode_area, area_name, region_country, assigned_region_id, area_director_ids } = data;
  const cleanArea = postcode_area.trim().toUpperCase();

  if (!cleanArea || !region_country || !assigned_region_id) {
    return { error: "Missing required fields" };
  }

  try {
    const existingRoute = await prismadb.nextcrm_postcode_routing.findUnique({
      where: { id },
    });

    if (!existingRoute) {
      return { error: "Postcode routing rule not found" };
    }

    // Regional Directors can only edit routes within their assigned region ID
    if (actor.role === "regional_director") {
      if (existingRoute.assigned_region_id !== actor.region_id || Number(assigned_region_id) !== actor.region_id) {
        return { error: "Forbidden: You can only manage postcode routes in your own region." };
      }
    }

    // Check unique constraint if postcode_area changed
    if (existingRoute.postcode_area !== cleanArea) {
      const duplicate = await prismadb.nextcrm_postcode_routing.findUnique({
        where: { postcode_area: cleanArea },
      });
      if (duplicate) {
        return { error: "Postcode area rule already exists" };
      }
    }

    const updated = await prismadb.nextcrm_postcode_routing.update({
      where: { id },
      data: {
        postcode_area: cleanArea,
        area_name: area_name || null,
        region_country,
        assigned_region_id: Number(assigned_region_id),
      },
    });

    // Sync many-to-many assignments: Delete old, recreate new
    await prismadb.postcodeRoutingToAreaDirectors.deleteMany({
      where: { postcode_routing_id: id }
    });

    if (area_director_ids && area_director_ids.length > 0) {
      await prismadb.postcodeRoutingToAreaDirectors.createMany({
        data: area_director_ids.map((adId) => ({
          postcode_routing_id: id,
          area_director_id: adId,
        }))
      });
    }

    // Log to audit log
    await prismadb.sys_audit_logs.create({
      data: {
        entity_type: "nextcrm_postcode_routing",
        entity_id: updated.id,
        field_mutated: "ALL",
        old_value: JSON.stringify(existingRoute),
        new_value: JSON.stringify(updated),
      },
    });

    revalidatePath("/[locale]/(routes)/admin/postcode-routing", "page");
    return { success: true, route: updated };
  } catch (error) {
    console.error("[UPDATE_POSTCODE_ROUTE_ERROR]", error);
    return { error: "Failed to update postcode routing rule" };
  }
}

export async function deletePostcodeRoute(id: string) {
  await requireRole(["admin", "ceo", "operations_director"]);

  try {
    const existingRoute = await prismadb.nextcrm_postcode_routing.findUnique({
      where: { id },
    });

    if (!existingRoute) {
      return { error: "Postcode routing rule not found" };
    }

    await prismadb.nextcrm_postcode_routing.delete({
      where: { id },
    });

    // Log to audit log
    await prismadb.sys_audit_logs.create({
      data: {
        entity_type: "nextcrm_postcode_routing",
        entity_id: id,
        field_mutated: "DELETED",
        old_value: JSON.stringify(existingRoute),
      },
    });

    revalidatePath("/[locale]/(routes)/admin/postcode-routing", "page");
    return { success: true };
  } catch (error) {
    console.error("[DELETE_POSTCODE_ROUTE_ERROR]", error);
    return { error: "Failed to delete postcode routing rule" };
  }
}
