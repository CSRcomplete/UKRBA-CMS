"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";

const ADMIN_ROLES = ["admin", "ceo", "coo"];
const SUPERVISOR_ROLES = ["regional_director", "area_director"];

export const deleteLead = async (leadId: string) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  if (!leadId) return { error: "leadId is required" };

  const isAdmin = ADMIN_ROLES.includes(session.user.role);
  const isSupervisor = SUPERVISOR_ROLES.includes(session.user.role);

  if (!isAdmin && !isSupervisor) {
    return { error: "Forbidden" };
  }

  if (isSupervisor && !isAdmin) {
    const lead = await prismadb.crm_Leads.findUnique({
      where: { id: leadId },
      select: { assigned_to: true },
    });
    if (!lead || lead.assigned_to !== session.user.id) {
      return { error: "Forbidden" };
    }
  }

  try {
    await prismadb.crm_Leads.update({
      where: { id: leadId },
      data: { deletedAt: new Date(), deletedBy: session.user.id },
    });
    await writeAuditLog({
      entityType: "lead",
      entityId: leadId,
      action: "deleted",
      changes: null,
      userId: session.user.id,
    });
    revalidatePath("/[locale]/(routes)/crm/leads", "page");
    return { success: true };
  } catch (error) {
    console.log("[DELETE_LEAD]", error);
    return { error: "Failed to delete lead" };
  }
};
