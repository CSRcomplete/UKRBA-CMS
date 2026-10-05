import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, leadReadScopeWhere } from "@/lib/authz";

export const getLeadsCount = async () => {
  const user = await requireAuthenticated();
  const where = await leadReadScopeWhere(user);
  const data = await prismadb.crm_Leads.count({ where });
  return data;
};
