"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";

export type FivePoundEmailFlowRow = {
  id: string;
  leadId: string;
  leadName: string;
  statusLabel: string;
  createdAt: string;
};

function computeStatusLabel(
  status: "in_progress" | "customer_bought" | "completed_no_purchase",
  sentStepCount: number
): string {
  if (status === "customer_bought") return "Client converted";
  if (status === "completed_no_purchase") return "Manual Followup required";
  if (sentStepCount >= 3) return "3rd Email sent";
  if (sentStepCount === 2) return "2nd Email sent";
  if (sentStepCount === 1) return "1st Email sent";
  return "Starting…";
}

export async function getFivePoundEmailFlows(): Promise<FivePoundEmailFlowRow[]> {
  const session = await getSession();
  if (!session?.user?.id) return [];
  const userId = session.user.id;

  const dbUser = await prismadb.users.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const role = dbUser?.role?.toLowerCase() || "";
  const isAdmin = ["admin", "ceo", "coo"].includes(role);

  const flows = await prismadb.crm_LeadEmailFlow.findMany({
    where: isAdmin
      ? undefined
      : {
          lead: {
            OR: [
              { assigned_to: userId },
              { assigned_area_director_id: userId },
              { assigned_regional_director_id: userId },
            ],
          },
        },
    include: {
      lead: { select: { id: true, firstName: true, lastName: true } },
      steps: { select: { sent_at: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return flows.map((flow) => {
    const sentStepCount = flow.steps.filter((s) => s.sent_at).length;
    return {
      id: flow.id,
      leadId: flow.lead_id,
      leadName: `${flow.lead.firstName || ""} ${flow.lead.lastName}`.trim(),
      statusLabel: computeStatusLabel(flow.status, sentStepCount),
      createdAt: flow.created_at.toISOString(),
    };
  });
}
