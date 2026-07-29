import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";
import Container from "../components/ui/Container";
import { serializeDecimalsList } from "@/lib/serialize-decimals";
import { AccountsPaymentAllocationsCard } from "../components/dasboard/AccountsPaymentAllocationsCard";

export default async function AccountsPaymentsPage() {
  const session = await getSession();

  if (!session) redirect("/sign-in");

  const userId = session.user?.id as string;

  const currentUser = await prismadb.users.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const userRole = currentUser?.role || "user";

  let paymentAllocations: any[] = [];
  let totalAllocatedSum = 0;
  let approvedCount = 0;
  let pendingCount = 0;

  try {
    const rawPaymentAllocations = await prismadb.crm_Payment_Allocations.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    paymentAllocations = serializeDecimalsList(rawPaymentAllocations).map((a: any) => ({
      ...a,
      sale_amount: Number(a.sale_amount || 0),
      total_percentage: Number(a.total_percentage || 0),
      total_allocated: Number(a.total_allocated || 0),
      partner_percentage: Number(a.partner_percentage || 0),
      team_allocations: (a.team_allocations as any[]) || [],
    }));

    const totalAllocatedSumRaw = await prismadb.crm_Payment_Allocations.aggregate({
      _sum: {
        total_allocated: true,
      },
    });
    totalAllocatedSum = Number(totalAllocatedSumRaw._sum?.total_allocated || 0);

    approvedCount = await prismadb.crm_Payment_Allocations.count({
      where: { status: "approved" },
    });

    pendingCount = await prismadb.crm_Payment_Allocations.count({
      where: { status: "pending" },
    });
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
