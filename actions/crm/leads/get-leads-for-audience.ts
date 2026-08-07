import { cache } from "react";
import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, leadReadScopeWhere, AuthenticationError } from "@/lib/authz";
import { extractPostcodeArea } from "@/lib/postcode";

export interface AudienceLead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  postcode: string | null;
  postcodeArea: string;
}

/**
 * Leads with an email address, for picking a campaign audience by postcode
 * or individually. Scoped the same way as the leads list (leadReadScopeWhere).
 */
export const getLeadsForAudience = cache(async (): Promise<AudienceLead[]> => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    throw e;
  }

  const leadScope = await leadReadScopeWhere(user);
  const leads = await prismadb.crm_Leads.findMany({
    where: { ...leadScope, email: { not: null }, deletedAt: null },
    select: { id: true, firstName: true, lastName: true, email: true, company: true, postcode: true },
    orderBy: { createdAt: "desc" },
  });

  return leads
    .filter((l) => l.email)
    .map((l) => ({
      id: l.id,
      name: [l.firstName, l.lastName].filter(Boolean).join(" ") || l.email!,
      email: l.email!,
      company: l.company,
      postcode: l.postcode,
      postcodeArea: extractPostcodeArea(l.postcode),
    }));
});
