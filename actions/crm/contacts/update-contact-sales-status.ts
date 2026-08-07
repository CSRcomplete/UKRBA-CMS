"use server";

import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, isAdmin } from "@/lib/authz";
import { writeAuditLog } from "@/lib/audit-log";
import { revalidatePath } from "next/cache";
import { SalesStatus } from "@prisma/client";
import { SALES_STATUS_VALUES } from "@/lib/sales-status";

export const updateContactSalesStatus = async (contactId: string, salesStatus: SalesStatus | null) => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch {
    return { error: "Unauthorized" };
  }

  if (salesStatus !== null && !SALES_STATUS_VALUES.includes(salesStatus)) {
    return { error: "Invalid sales status" };
  }

  const contact = await prismadb.crm_Contacts.findUnique({
    where: { id: contactId, deletedAt: null },
    select: { id: true, assigned_to: true, sales_status: true },
  });
  if (!contact) return { error: "Contact not found" };

  const canManage = isAdmin(user) || contact.assigned_to === user.id;
  if (!canManage) {
    return { error: "Forbidden: only this contact's assigned director/partner or CEO, COO and Admin can set the sales status." };
  }

  const updated = await prismadb.crm_Contacts.update({
    where: { id: contactId },
    data: { sales_status: salesStatus, updatedBy: user.id, updatedAt: new Date() },
  });

  await writeAuditLog({
    entityType: "contact",
    entityId: contactId,
    action: "updated",
    changes: [{ field: "sales_status", old: contact.sales_status, new: salesStatus }],
    userId: user.id,
  });

  revalidatePath(`/crm/contacts/${contactId}`);
  return { success: true, contact: updated };
};
