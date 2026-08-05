"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import sendEmail from "@/lib/sendmail";

export type TeamAllocationItem = {
  userId: string;
  userName: string;
  percentage: number;
  amount: number;
};

import { serializeDecimals } from "@/lib/serialize-decimals";

export async function getContactPaymentAllocation(contactId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const allocation = await prismadb.crm_Payment_Allocations.findFirst({
      where: { contact_id: contactId },
      orderBy: { createdAt: "desc" },
    });

    const activeUsers = await prismadb.users.findMany({
      where: { userStatus: "ACTIVE" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: { name: "asc" },
    });

    const serializedAlloc = allocation ? serializeDecimals(allocation) : null;

    return {
      allocation: serializedAlloc
        ? {
            ...serializedAlloc,
            sale_amount: Number(serializedAlloc.sale_amount || 0),
            partner_percentage: Number(serializedAlloc.partner_percentage || 0),
            partner_amount: Number(serializedAlloc.partner_amount || 0),
            total_percentage: Number(serializedAlloc.total_percentage || 0),
            total_allocated: Number(serializedAlloc.total_allocated || 0),
            team_allocations: (serializedAlloc.team_allocations as TeamAllocationItem[]) || [],
          }
        : null,
      activeUsers: activeUsers.map((u) => ({
        id: u.id,
        name: u.name || u.email,
        email: u.email,
        role: u.role,
      })),
      currentUserRole: session.user.role || "user",
    };
  } catch (error: any) {
    console.error("[GET_PAYMENT_ALLOCATION_ERROR]", error);
    return { error: error.message || "Failed to fetch payment allocation" };
  }
}

export async function saveContactPaymentAllocation(data: {
  contactId: string;
  customerName: string;
  saleAmount: number;
  teamAllocations: TeamAllocationItem[];
  partnerName?: string;
  partnerPercentage?: number;
}) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const role = (session.user.role || "").toLowerCase();
  if (role !== "admin" && role !== "ceo" && role !== "coo") {
    return { error: "Security Restriction: Only CEO and Admin can modify payment allocations." };
  }

  const { contactId, customerName, saleAmount, teamAllocations, partnerName, partnerPercentage = 0 } = data;

  if (!contactId) return { error: "Contact ID is required" };
  if (saleAmount < 0) return { error: "Sale amount must be a positive number" };

  // Filter valid team allocations
  const validTeamAllocations = (teamAllocations || [])
    .filter((item) => item.userId && item.userId !== "none" && item.percentage > 0)
    .slice(0, 6) // Max 6 team members
    .map((item) => {
      const p = Math.min(100, Math.max(0, item.percentage));
      const amt = Number(((saleAmount * p) / 100).toFixed(2));
      return {
        userId: item.userId,
        userName: item.userName,
        percentage: p,
        amount: amt,
      };
    });

  const partnerP = Math.min(100, Math.max(0, partnerPercentage || 0));
  const partnerAmt = Number(((saleAmount * partnerP) / 100).toFixed(2));

  const teamTotalP = validTeamAllocations.reduce((sum, item) => sum + item.percentage, 0);
  const totalP = Number((teamTotalP + partnerP).toFixed(2));

  const teamTotalAmt = validTeamAllocations.reduce((sum, item) => sum + item.amount, 0);
  const totalAmt = Number((teamTotalAmt + partnerAmt).toFixed(2));

  try {
    const existing = await prismadb.crm_Payment_Allocations.findFirst({
      where: { contact_id: contactId },
    });

    let savedRecord;
    if (existing) {
      savedRecord = await prismadb.crm_Payment_Allocations.update({
        where: { id: existing.id },
        data: {
          customer_name: customerName,
          sale_amount: saleAmount,
          team_allocations: validTeamAllocations,
          partner_name: partnerName ? partnerName.trim() : null,
          partner_percentage: partnerP,
          partner_amount: partnerAmt,
          total_percentage: totalP,
          total_allocated: totalAmt,
          updatedAt: new Date(),
        },
      });
    } else {
      savedRecord = await prismadb.crm_Payment_Allocations.create({
        data: {
          contact_id: contactId,
          customer_name: customerName,
          sale_amount: saleAmount,
          team_allocations: validTeamAllocations,
          partner_name: partnerName ? partnerName.trim() : null,
          partner_percentage: partnerP,
          partner_amount: partnerAmt,
          total_percentage: totalP,
          total_allocated: totalAmt,
          createdBy: session.user.id,
        },
      });

      // New live sale — notify support so the allocation gets actioned
      const notifyTo = process.env.SALES_NOTIFY_EMAIL || "support@ukrba.org";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "";
      try {
        await sendEmail({
          from: process.env.EMAIL_FROM,
          to: notifyTo,
          subject: `New Live Sale — Payment Allocation Required: ${customerName}`,
          text: `A new live sale has been recorded for ${customerName} (£${saleAmount.toLocaleString(
            "en-GB",
            { minimumFractionDigits: 2 }
          )}).\n\nPercentage allocation is still pending approval.\n\nOpen the customer record and go to the Payment Allocation tab to allocate and approve:\n${appUrl}/crm/contacts/${contactId}\n\nThank you,\n${process.env.NEXT_PUBLIC_APP_NAME || "UKRBA CMS"}`,
        });
      } catch (emailErr) {
        console.error("[SALE_NOTIFY_EMAIL_ERROR]", emailErr);
      }
    }

    revalidatePath(`/crm/contacts/${contactId}`);
    return { success: true, allocation: savedRecord };
  } catch (error: any) {
    console.error("[SAVE_PAYMENT_ALLOCATION_ERROR]", error);
    return { error: error.message || "Failed to save payment allocation" };
  }
}

export async function approvePaymentAllocation(contactId: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const role = (session.user.role || "").toLowerCase();
  if (role !== "admin" && role !== "ceo" && role !== "coo") {
    return { error: "Security Restriction: Only CEO and Admin can approve payment allocations." };
  }

  try {
    const allocation = await prismadb.crm_Payment_Allocations.findFirst({
      where: { contact_id: contactId },
    });

    if (!allocation) {
      return { error: "No payment allocation record found to approve." };
    }

    const updated = await prismadb.crm_Payment_Allocations.update({
      where: { id: allocation.id },
      data: {
        status: "approved",
        approved_by: session.user.id,
        approved_at: new Date(),
      },
    });

    revalidatePath(`/crm/contacts/${contactId}`);
    return { success: true, allocation: updated };
  } catch (error: any) {
    console.error("[APPROVE_PAYMENT_ALLOCATION_ERROR]", error);
    return { error: error.message || "Failed to approve payment allocation" };
  }
}
