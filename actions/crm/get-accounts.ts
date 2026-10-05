import { cache } from "react";
import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, accountReadScopeWhere } from "@/lib/authz";

export const getAccounts = cache(async () => {
  const user = await requireAuthenticated();
  const scope = await accountReadScopeWhere(user);
  const data = await prismadb.crm_Accounts.findMany({
    where: scope,
    include: {
      assigned_to_user: {
        select: {
          name: true,
        },
      },
      contacts: {
        select: {
          first_name: true,
          last_name: true,
        },
      },
      // Watchers relationship through AccountWatchers junction table
      watchers: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return data;
});
