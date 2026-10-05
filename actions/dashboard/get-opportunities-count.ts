import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, opportunityReadScopeWhere } from "@/lib/authz";

export const getOpportunitiesCount = async () => {
  const user = await requireAuthenticated();
  const where = await opportunityReadScopeWhere(user);
  const data = await prismadb.crm_Opportunities.count({ where });
  return data;
};
