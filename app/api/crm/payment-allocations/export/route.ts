import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contactId");
  const includeAll = searchParams.get("status") === "all";

  try {
    // Accounts should only be paying out approved allocations
    const whereCondition: any = includeAll ? {} : { status: "approved" };
    if (contactId) {
      whereCondition.contact_id = contactId;
    }

    const allocations = await prismadb.crm_Payment_Allocations.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
    });

    const userIds = allocations
      .map((a) => a.approved_by)
      .filter(Boolean) as string[];

    const approverUsers = await prismadb.users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const approverMap = new Map(approverUsers.map((u) => [u.id, u.name || u.email]));

    // Build CSV headers
    const csvRows = [
      [
        "Customer / Contact Name",
        "Sale Date",
        "Total Sale Amount (£)",
        "Recipient Name",
        "Recipient Type",
        "Percentage Allocated (%)",
        "Payment Amount (£)",
        "Allocation Status",
        "Approved By",
        "Approval Date",
      ].join(","),
    ];

    for (const alloc of allocations) {
      const customerName = `"${(alloc.customer_name || "N/A").replace(/"/g, '""')}"`;
      const saleDate = alloc.sale_date ? new Date(alloc.sale_date).toISOString().split("T")[0] : "";
      const saleAmount = Number(alloc.sale_amount).toFixed(2);
      const status = alloc.status === "approved" ? "Approved" : "Pending";
      const approvedBy = alloc.approved_by ? `"${(approverMap.get(alloc.approved_by) || "Admin").replace(/"/g, '""')}"` : "N/A";
      const approvedDate = alloc.approved_at ? new Date(alloc.approved_at).toISOString().split("T")[0] : "N/A";

      // Team members
      const teamItems = (alloc.team_allocations as any[]) || [];
      for (const item of teamItems) {
        if (item.userName && item.percentage > 0) {
          const recipientName = `"${item.userName.replace(/"/g, '""')}"`;
          const recipientType = "Internal Staff";
          const pct = Number(item.percentage).toFixed(2);
          const amt = Number(item.amount).toFixed(2);

          csvRows.push(
            [
              customerName,
              saleDate,
              saleAmount,
              recipientName,
              recipientType,
              pct,
              amt,
              status,
              approvedBy,
              approvedDate,
            ].join(",")
          );
        }
      }

      // External Partner
      if (alloc.partner_name && Number(alloc.partner_percentage) > 0) {
        const partnerName = `"${alloc.partner_name.replace(/"/g, '""')}"`;
        const recipientType = "External Partner";
        const pct = Number(alloc.partner_percentage).toFixed(2);
        const amt = Number(alloc.partner_amount).toFixed(2);

        csvRows.push(
          [
            customerName,
            saleDate,
            saleAmount,
            partnerName,
            recipientType,
            pct,
            amt,
            status,
            approvedBy,
            approvedDate,
          ].join(",")
        );
      }
    }

    const csvContent = csvRows.join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="payment_allocations_accounts_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error("[EXPORT_PAYMENT_ALLOCATIONS_CSV_ERROR]", error);
    return new NextResponse("Failed to export payment allocations CSV", { status: 500 });
  }
}
