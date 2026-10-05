"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import sendEmail from "@/lib/sendmail";
import { requireAuthenticated, contactReadScopeWhere, type AuthzUser } from "@/lib/authz";

export type TeamAllocationItem = {
  userId: string;
  userName: string;
  percentage: number;
  amount: number;
};

import { serializeDecimals, serializeDecimalsList } from "@/lib/serialize-decimals";

const PRIVILEGED_ROLES = ["admin", "ceo", "coo", "operations_director", "manager"];

/**
 * Payment allocations a given user is allowed to see. Privileged roles see
 * everything (today's behavior). Everyone else sees only allocations tied to
 * them: their own contacts (via contactReadScopeWhere, which already covers
 * an RD's/AD's hierarchy), their own external-partner rows, or allocations
 * for a lead assigned to them as RD/AD/email partner (matched via the same
 * email heuristic getContactPaymentAllocation's suggestions use — there's no
 * direct FK from crm_Payment_Allocations to crm_Leads).
 */
export async function getScopedPaymentAllocations(user: AuthzUser) {
  if (PRIVILEGED_ROLES.includes(user.role)) {
    return prismadb.crm_Payment_Allocations.findMany({ orderBy: { createdAt: "desc" } });
  }

  const scopedContacts = await prismadb.crm_Contacts.findMany({
    where: await contactReadScopeWhere(user),
    select: { id: true },
  });
  const contactIdsFromScope = scopedContacts.map((c) => c.id);

  const leadsAssignedToMe = await prismadb.crm_Leads.findMany({
    where: {
      OR: [
        { assigned_email_partner_id: user.id },
        { assigned_regional_director_id: user.id },
        { assigned_area_director_id: user.id },
      ],
    },
    select: { email: true },
  });
  const emailsAssignedToMe = leadsAssignedToMe.map((l) => l.email).filter((e): e is string => !!e);

  const contactsFromLeadEmails = emailsAssignedToMe.length
    ? await prismadb.crm_Contacts.findMany({
        where: { email: { in: emailsAssignedToMe, mode: "insensitive" } },
        select: { id: true },
      })
    : [];

  const contactIds = Array.from(
    new Set([...contactIdsFromScope, ...contactsFromLeadEmails.map((c) => c.id)])
  );

  const directMatches = await prismadb.crm_Payment_Allocations.findMany({
    where: {
      OR: [
        ...(contactIds.length ? [{ contact_id: { in: contactIds } }] : []),
        { partner_user_id: user.id },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  // A user can also be manually added to an internal team-allocation slot by
  // an admin without being the lead's RD/AD/email partner — team_allocations
  // is a JSON array, so this can't be expressed as a plain Prisma `where`.
  // This table is sale-ledger sized (not lead-volume sized), so filtering a
  // bounded fetch in application code is an acceptable, pragmatic tradeoff.
  const allAllocations = await prismadb.crm_Payment_Allocations.findMany({
    orderBy: { createdAt: "desc" },
    take: 1000,
  });
  const teamMatches = allAllocations.filter((a) =>
    Array.isArray(a.team_allocations) &&
    (a.team_allocations as unknown as TeamAllocationItem[]).some((t) => t?.userId === user.id)
  );

  const byId = new Map(
    [...directMatches, ...teamMatches].map((a) => [a.id, a])
  );
  return Array.from(byId.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

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

    // If this contact came from a lead an email partner originated, suggest
    // that partner as the External Partner allocation. If it came from a
    // lead assigned to a Regional/Area Director, suggest them as an
    // (unfilled — no percentage) internal team slot. Both are still fully
    // editable — this only pre-fills, it never auto-saves or auto-pays out.
    let suggestedPartner: { id: string; name: string } | null = null;
    let suggestedTeamMembers: { id: string; name: string }[] = [];
    if (!allocation) {
      const contact = await prismadb.crm_Contacts.findUnique({
        where: { id: contactId },
        select: { email: true },
      });
      if (contact?.email) {
        const lead = await prismadb.crm_Leads.findFirst({
          where: { email: { equals: contact.email, mode: "insensitive" } },
          orderBy: { updatedAt: "desc" },
          select: {
            assigned_email_partner_id: true,
            assigned_regional_director_id: true,
            assigned_area_director_id: true,
          },
        });

        const suggestedIds = [
          lead?.assigned_email_partner_id,
          lead?.assigned_regional_director_id,
          lead?.assigned_area_director_id,
        ].filter((id): id is string => !!id);

        if (suggestedIds.length > 0) {
          const suggestedUsers = await prismadb.users.findMany({
            where: { id: { in: suggestedIds } },
            select: { id: true, name: true, email: true },
          });
          const byId = new Map(suggestedUsers.map((u) => [u.id, u.name || u.email]));

          if (lead?.assigned_email_partner_id && byId.has(lead.assigned_email_partner_id)) {
            suggestedPartner = { id: lead.assigned_email_partner_id, name: byId.get(lead.assigned_email_partner_id)! };
          }
          for (const id of [lead?.assigned_regional_director_id, lead?.assigned_area_director_id]) {
            if (id && byId.has(id)) {
              suggestedTeamMembers.push({ id, name: byId.get(id)! });
            }
          }
        }
      }
    }

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
      suggestedPartner,
      suggestedTeamMembers,
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
  partnerUserId?: string | null;
}) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const role = (session.user.role || "").toLowerCase();
  if (role !== "admin" && role !== "ceo" && role !== "coo") {
    return { error: "Security Restriction: Only CEO and Admin can modify payment allocations." };
  }

  const { contactId, customerName, saleAmount, teamAllocations, partnerName, partnerPercentage = 0, partnerUserId = null } = data;

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
          partner_user_id: partnerUserId || null,
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
          partner_user_id: partnerUserId || null,
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
