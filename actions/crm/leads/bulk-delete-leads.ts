"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeAuditLog } from "@/lib/audit-log";

export const bulkDeleteLeads = async (leadIds: string[]) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  if (session.user.role !== "admin" && session.user.role !== "ceo") {
    return { error: "Forbidden" };
  }

  if (!leadIds || leadIds.length === 0) return { error: "leadIds are required" };

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
