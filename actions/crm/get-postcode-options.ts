import { cache } from "react";
import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, isAdmin, AuthenticationError } from "@/lib/authz";

export interface PostcodeOption {
  postcode_area: string;
  area_name: string | null;
}

/**
 * Postcode areas selectable in the leads filter. Admin/CEO/COO see every
 * postcode area in the system; everyone else only sees the areas they're
 * personally assigned to (as a Regional or Area Director).
 */
export const getPostcodeOptions = cache(async (): Promise<PostcodeOption[]> => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    throw e;
  }

  if (isAdmin(user)) {
    return prismadb.nextcrm_postcode_routing.findMany({
      orderBy: { postcode_area: "asc" },
      select: { postcode_area: true, area_name: true },
    });
  }

  return prismadb.nextcrm_postcode_routing.findMany({
    where: {
      OR: [
        { regional_directors: { some: { regional_director_id: user.id } } },
        { area_directors: { some: { area_director_id: user.id } } },
      ],
    },
    orderBy: { postcode_area: "asc" },
    select: { postcode_area: true, area_name: true },
  });
});
