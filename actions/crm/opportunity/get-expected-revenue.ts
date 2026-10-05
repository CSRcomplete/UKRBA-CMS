import { prismadb } from "@/lib/prisma";
import { getExchangeRates, convertAmount } from "@/lib/currency";
import { Decimal } from "@prisma/client/runtime/client";
import { requireAuthenticated, opportunityReadScopeWhere } from "@/lib/authz";

export const getExpectedRevenue = async (displayCurrency: string) => {
  const user = await requireAuthenticated();
  const readScope = await opportunityReadScopeWhere(user);

  const activeOpportunities = await prismadb.crm_Opportunities.findMany({
    where: {
      ...readScope,
      status: "ACTIVE",
    },
    select: {
      budget: true,
      currency: true,
    },
  });

  const rates = await getExchangeRates();

  let total = new Decimal(0);
  for (const opp of activeOpportunities) {
    const budget = new Decimal(opp.budget?.toString() ?? "0");
    const from = opp.currency || displayCurrency;
    const converted = convertAmount(budget, from, displayCurrency, rates);
    total = total.add(converted ?? budget);
  }

  return total.toNumber();
};
