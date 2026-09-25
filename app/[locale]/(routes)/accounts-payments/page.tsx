import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";
import Container from "../components/ui/Container";
import { serializeDecimalsList } from "@/lib/serialize-decimals";
import { AccountsPaymentAllocationsCard } from "../components/dasboard/AccountsPaymentAllocationsCard";
import { requireAuthenticated } from "@/lib/authz";
import { getScopedPaymentAllocations } from "@/actions/crm/payment-allocations";

export default async function AccountsPaymentsPage() {
  const session = await getSession();

  if (!session) redirect("/sign-in");

  const authzUser = await requireAuthenticated();
  const userRole = authzUser.role || "user";

  let paymentAllocations: any[] = [];
  let totalAllocatedSum = 0;
  let approvedCount = 0;
  let pendingCount = 0;

  try {
    const scoped = await getScopedPaymentAllocations(authzUser);
    const isPrivileged = ["admin", "ceo", "coo", "operations_director", "manager"].includes(userRole);

    paymentAllocations = serializeDecimalsList(isPrivileged ? scoped.slice(0, 5) : scoped).map((a: any) => ({
      ...a,
      sale_amount: Number(a.sale_amount || 0),
      total_percentage: Number(a.total_percentage || 0),
      total_allocated: Number(a.total_allocated || 0),
      partner_percentage: Number(a.partner_percentage || 0),
      team_allocations: (a.team_allocations as any[]) || [],
    }));

    totalAllocatedSum = scoped.reduce((sum, a) => sum + Number(a.total_allocated || 0), 0);
    approvedCount = scoped.filter((a) => a.status === "approved").length;
    pendingCount = scoped.filter((a) => a.status === "pending").length;
  } catch (paymentErr) {
    console.error("[PAYMENT_ALLOCATION_PAGE_ERROR]", paymentErr);
  }

  return (
    <Container
      title="Accounts & Payments"
      description="Live customer sale allocations, partner commission splits, and accounts CSV export."
    >
      <AccountsPaymentAllocationsCard
        allocations={paymentAllocations}
        totalAllocatedSum={totalAllocatedSum}
        approvedCount={approvedCount}
        pendingCount={pendingCount}
        userRole={userRole}
      />
    </Container>
  );
}
