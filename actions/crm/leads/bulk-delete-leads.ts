"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";

const ADMIN_ROLES = ["admin", "ceo", "coo"];
const SUPERVISOR_ROLES = ["regional_director", "area_director"];

export const bulkDeleteLeads = async (leadIds: string[]) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  if (!leadIds || leadIds.length === 0) return { error: "leadIds are required" };

  const isAdmin = ADMIN_ROLES.includes(session.user.role);
  const isSupervisor = SUPERVISOR_ROLES.includes(session.user.role);

  if (!isAdmin && !isSupervisor) {
    return { error: "Forbidden" };
  }

  if (isSupervisor && !isAdmin) {
    const leads = await prismadb.crm_Leads.findMany({
      where: { id: { in: leadIds } },
      select: { id: true, assigned_to: true },
    });
    const unowned = leads.some((l) => l.assigned_to !== session.user.id);
    if (unowned || leads.length !== leadIds.length) {
      return { error: "Forbidden" };
    }
  }

  try {
    await prismadb.crm_Leads.updateMany({
      where: { id: { in: leadIds } },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });

    // Write audit logs in parallel
    await Promise.allSettled(
      leadIds.map((id) =>
        writeAuditLog({
          entityType: "lead",
          entityId: id,
          action: "deleted",
          changes: null,
          userId: session.user.id,
        })
      )
    );

    revalidatePath("/[locale]/(routes)/crm/leads", "page");
    return { success: true };
  } catch (error) {
    console.log("[BULK_DELETE_LEADS]", error);
    return { error: "Failed to delete leads" };
  }
};
