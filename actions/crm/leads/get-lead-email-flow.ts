"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";

export type LeadEmailFlowStepData = {
  id: string;
  step_number: number;
  subject: string;
  body: string;
  sent_at: string | null;
};

export type LeadEmailFlowData = {
  id: string;
  status: "in_progress" | "customer_bought" | "completed_no_purchase";
  steps: LeadEmailFlowStepData[];
};

export async function getLeadEmailFlow(leadId: string): Promise<LeadEmailFlowData | null> {
  const session = await getSession();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const lead = await prismadb.crm_Leads.findUnique({
    where: { id: leadId },
    select: {
      assigned_to: true,
      assigned_area_director_id: true,
      assigned_regional_director_id: true,
    },
  });
  if (!lead) return null;

  const dbUser = await prismadb.users.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  const role = dbUser?.role?.toLowerCase() || "";
  const isAdmin = ["admin", "ceo", "coo"].includes(role);

  const isOwnerOrDirector =
    lead.assigned_to === userId ||
    lead.assigned_area_director_id === userId ||
    lead.assigned_regional_director_id === userId;

  if (!isAdmin && !isOwnerOrDirector) return null;

  const flow = await prismadb.crm_LeadEmailFlow.findFirst({
    where: { lead_id: leadId },
    orderBy: { created_at: "desc" },
    include: { steps: { orderBy: { step_number: "asc" } } },
  });

  if (!flow) return null;

  return {
    id: flow.id,
    status: flow.status,
    steps: flow.steps.map((s) => ({
      id: s.id,
      step_number: s.step_number,
      subject: s.subject,
      body: s.body,
      sent_at: s.sent_at ? s.sent_at.toISOString() : null,
    })),
  };
}
