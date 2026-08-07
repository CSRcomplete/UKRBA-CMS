"use server";

import { prismadb } from "@/lib/prisma";
import { requireAuthenticated } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";
import { SalesStatus } from "@prisma/client";
import { SALES_STATUS_VALUES } from "@/lib/sales-status";
import { canManageLeadSalesStatus } from "@/lib/sales-status-permissions";

export const updateLeadSalesStatus = async (leadId: string, salesStatus: SalesStatus | null) => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch {
    return { error: "Unauthorized" };
  }

  if (salesStatus !== null && !SALES_STATUS_VALUES.includes(salesStatus)) {
    return { error: "Invalid sales status" };
  }

  const lead = await prismadb.crm_Leads.findUnique({
    where: { id: leadId, deletedAt: null },
    select: {
      id: true,
      assigned_to: true,
      assigned_partner_id: true,
      assigned_area_director_id: true,
      assigned_regional_director_id: true,
      sales_status: true,
    },
  });
  if (!lead) return { error: "Lead not found" };

  if (!canManageLeadSalesStatus(user, lead)) {
    return { error: "Forbidden: only the lead's assigned director/partner or CEO, COO and Admin can set the sales status." };
  }

  const updated = await prismadb.crm_Leads.update({
    where: { id: leadId },
    data: { sales_status: salesStatus, updatedBy: user.id, updatedAt: new Date() },
  });

  await writeAuditLog({
    entityType: "lead",
    entityId: leadId,
    action: "updated",
    changes: [{ field: "sales_status", old: lead.sales_status, new: salesStatus }],
    userId: user.id,
  });

  revalidatePath(`/crm/leads/${leadId}`);
  return { success: true, lead: updated };
};
