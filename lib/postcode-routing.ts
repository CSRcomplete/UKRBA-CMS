import { prismadb } from "@/lib/prisma";
import { extractPostcodeArea } from "@/lib/postcode";

export type PostcodeRouteResult = {
  ownerId: string | null;
  areaDirectorId: string | null;
  regionalDirectorId: string | null;
};

// Round-robin: pick whichever director (of a list) has the fewest auto-routed
// leads for this prefix.
async function pickByRoundRobin<T extends { id: string }>(
  candidates: T[],
  prefix: string,
  countField: "assigned_area_director_id" | "assigned_regional_director_id"
): Promise<T> {
  const counts = await Promise.all(
    candidates.map(async (director) => {
      const count = await prismadb.crm_Leads.count({
        where: {
          [countField]: director.id,
          postcode: { startsWith: prefix, mode: "insensitive" },
        },
      });
      return { director, count };
    })
  );
  counts.sort((a, b) => a.count - b.count);
  return counts[0].director;
}

/**
 * Routes a postcode to an Area Director / Regional Director via
 * nextcrm_postcode_routing, round-robining between whoever is mapped to that
 * postcode area. Falls back to opsDirectorId when there's no postcode, no
 * routing rule for it, or no director mapped to the matched rule — matching
 * the fallback used across all postcode-driven lead/sale ingestion.
 */
export async function routeByPostcode(
  postcode: string | null | undefined,
  opsDirectorId: string | null
): Promise<PostcodeRouteResult> {
  if (!postcode) {
    return { ownerId: opsDirectorId, areaDirectorId: null, regionalDirectorId: null };
  }

  const prefix = extractPostcodeArea(postcode);
  const routingRule = await prismadb.nextcrm_postcode_routing.findUnique({
    where: { postcode_area: prefix },
  });

  if (!routingRule) {
    return { ownerId: opsDirectorId, areaDirectorId: null, regionalDirectorId: null };
  }

  const assignedRegionId = routingRule.assigned_region_id;

  const [assignedDirectors, assignedRegionalDirectors] = await Promise.all([
    prismadb.postcodeRoutingToAreaDirectors.findMany({
      where: { postcode_routing_id: routingRule.id },
      include: { area_director: true },
    }),
    prismadb.postcodeRoutingToRegionalDirectors.findMany({
      where: { postcode_routing_id: routingRule.id },
      include: { regional_director: true },
    }),
  ]);

  if (assignedDirectors.length > 0) {
    const selected = await pickByRoundRobin(
      assignedDirectors.map((ad) => ad.area_director),
      prefix,
      "assigned_area_director_id"
    );

    let regionalDirectorId: string | null = null;
    if (assignedRegionalDirectors.length > 0) {
      const selectedRd = await pickByRoundRobin(
        assignedRegionalDirectors.map((rd) => rd.regional_director),
        prefix,
        "assigned_regional_director_id"
      );
      regionalDirectorId = selectedRd.id;
    } else if (selected.parentId) {
      regionalDirectorId = selected.parentId;
    }

    return { ownerId: selected.id, areaDirectorId: selected.id, regionalDirectorId };
  }

  if (assignedRegionalDirectors.length > 0) {
    // No area director layer for this postcode — round-robin directly
    // between the Regional Directors sharing it.
    const selectedRd = await pickByRoundRobin(
      assignedRegionalDirectors.map((rd) => rd.regional_director),
      prefix,
      "assigned_regional_director_id"
    );
    return { ownerId: selectedRd.id, areaDirectorId: null, regionalDirectorId: selectedRd.id };
  }

  // Fallback to legacy single director assignment or region match
  let fallbackDirector = null;
  if (routingRule.area_director_id) {
    fallbackDirector = await prismadb.users.findUnique({
      where: { id: routingRule.area_director_id },
    });
  }
  if (!fallbackDirector) {
    fallbackDirector = await prismadb.users.findFirst({
      where: { region_id: assignedRegionId },
    });
  }

  if (fallbackDirector) {
    return {
      ownerId: fallbackDirector.id,
      areaDirectorId: fallbackDirector.id,
      regionalDirectorId: fallbackDirector.parentId || null,
    };
  }

  return { ownerId: opsDirectorId, areaDirectorId: null, regionalDirectorId: null };
}
