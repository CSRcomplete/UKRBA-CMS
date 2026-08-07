"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";
import { requireAuthenticated } from "@/lib/authz";
import { SalesStatus } from "@prisma/client";
import { SALES_STATUS_VALUES } from "@/lib/sales-status";
import { canManageLeadSalesStatus } from "@/lib/sales-status-permissions";

const WON_STATUS_NAME = "Won / Customer";

interface ConvertLeadParams {
  leadId: string;
  planName?: string;
  salesStatus: SalesStatus;
  changeReason?: string;
}

export async function convertLeadToMember({ leadId, planName, salesStatus, changeReason }: ConvertLeadParams) {
  const session = await getSession();
  const userId = session?.user?.id || null;

  if (!leadId) {
    return { error: "Lead ID is required." };
  }

  if (!salesStatus || !SALES_STATUS_VALUES.includes(salesStatus)) {
    return { error: "A valid sales status (membership tier) is required." };
  }

  try {
    // 1. Fetch Lead
    const lead = await prismadb.crm_Leads.findUnique({
      where: { id: leadId, deletedAt: null },
    });

    if (!lead) {
      return { error: "Lead not found in CRM database." };
    }

    // Permission check only applies to a human-initiated (session-based) conversion.
    // Trusted server-to-server calls (e.g. the Wix purchase webhook, already gated
    // by its own secret token) have no session and are allowed through.
    if (userId) {
      const user = await requireAuthenticated();
      if (!canManageLeadSalesStatus(user, lead)) {
        return { error: "Forbidden: only the lead's assigned director/partner or CEO, COO and Admin can set the sales status." };
      }
    }

    // 2. Resolve the "Won / Customer" pipeline status (kept separate from the
    // membership tier — the plan/tier lives in sales_status instead of being
    // baked into the status name)
    let statusRecord = await prismadb.crm_Lead_Statuses.findUnique({
      where: { name: WON_STATUS_NAME },
    });

    if (!statusRecord) {
      statusRecord = await prismadb.crm_Lead_Statuses.create({
        data: { v: 0, name: WON_STATUS_NAME },
      });
    }

    const now = new Date();

    // 3. Update Lead Record Status
    const updatedLead = await prismadb.crm_Leads.update({
      where: { id: leadId },
      data: {
        v: 1,
        updatedAt: now,
        updatedBy: userId || lead.createdBy,
        lead_status_id: statusRecord.id,
        sales_status: salesStatus,
      },
    });

    // 5. Ensure Contact Record Exists in crm_Contacts
    const contactEmail = lead.email?.trim().toLowerCase();
    let existingContact = null;

    if (contactEmail) {
      existingContact = await prismadb.crm_Contacts.findFirst({
        where: {
          email: { equals: contactEmail, mode: "insensitive" },
        },
      });
    }

    if (!existingContact) {
      existingContact = await prismadb.crm_Contacts.create({
        data: {
          v: 0,
          createdBy: userId || lead.createdBy,
          updatedBy: userId || lead.createdBy,
          first_name: lead.firstName || null,
          last_name: lead.lastName || "Lead",
          email: lead.email || null,
          office_phone: lead.phone || null,
          assigned_to: lead.assigned_to || null,
          sales_status: salesStatus,
        },
      });
    } else if (!existingContact.sales_status) {
      existingContact = await prismadb.crm_Contacts.update({
        where: { id: existingContact.id },
        data: { sales_status: salesStatus },
      });
    }

    // 6. Ensure Member Record Exists in crm_Members
    let existingMember = await prismadb.crm_Members.findUnique({
      where: { lead_id: lead.id },
    });

    if (!existingMember) {
      existingMember = await prismadb.crm_Members.create({
        data: {
          lead_id: lead.id,
          business_name: lead.company || "N/A",
          contact_name: [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "N/A",
          telephone: lead.phone || "N/A",
          email: lead.email || "N/A",
          assigned_channel_partner_id: lead.assigned_partner_id || lead.assigned_to || null,
          assigned_area_director_id: lead.assigned_area_director_id || null,
          assigned_regional_director_id: lead.assigned_regional_director_id || null,
          lifecycle_status: "Membership",
        },
      });
    }

    // 7. Write Audit Log
    if (userId) {
      await writeAuditLog({
        entityType: "lead",
        entityId: lead.id,
        action: "updated",
        changes: [
          { field: "lead_status", old: lead.lead_status_id, new: statusRecord.name },
          { field: "sales_status", old: lead.sales_status, new: salesStatus },
          { field: "converted_to_member", old: false, new: true },
        ],
        userId,
      });
    }

    revalidatePath("/[locale]/(routes)/crm/leads", "page");
    revalidatePath(`/crm/leads/${lead.id}`);

    return {
      success: true,
      lead: updatedLead,
      contact: existingContact,
      member: existingMember,
      statusName: statusRecord.name,
    };
  } catch (error: any) {
    console.error("[CONVERT_LEAD_TO_MEMBER_ERROR]", error);
    return { error: error.message || "Failed to convert lead to subscribed member." };
  }
}
