import { inngest } from "@/inngest/client";
import { prismadb } from "@/lib/prisma";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const STEP_DELAY = "3d";
const FINAL_GRACE_PERIOD = "3d";

async function resolveSender(leadId: string) {
  const lead = await prismadb.crm_Leads.findUnique({
    where: { id: leadId },
    select: { assigned_to_user: { select: { name: true, email: true } } },
  });
  const owner = lead?.assigned_to_user;
  const senderEmail = owner?.email || process.env.EMAIL_FROM!;
  const senderName = owner?.name;
  return {
    fromAddress: senderName ? `${senderName} <${senderEmail}>` : senderEmail,
    replyTo: owner?.email,
  };
}

async function createFollowUpTask(leadId: string, assignedTo: string, leadLabel: string) {
  let board = await prismadb.boards.findFirst({ where: { deletedAt: null } });
  if (!board) {
    board = await prismadb.boards.create({
      data: {
        v: 0,
        title: "CRM Tasks",
        description: "Default board for Lead and Member actions",
        user: assignedTo,
      },
    });
  }

  let section = await prismadb.sections.findFirst({
    where: { board: board.id },
    orderBy: { position: "asc" },
  });
  if (!section) {
    section = await prismadb.sections.create({
      data: { v: 0, title: "To Do", board: board.id, position: 0 },
    });
  }

  const tasksCount = await prismadb.tasks.count({ where: { section: section.id } });

  await prismadb.tasks.create({
    data: {
      v: 0,
      title: `Follow up: ${leadLabel} didn't purchase after assessment emails`,
      content:
        "The 3-step £5 Assessment upsell email sequence finished without a Premium SME plan purchase. Please reach out directly.",
      priority: "high",
      dueDateAt: new Date(),
      section: section.id,
      user: assignedTo,
      position: tasksCount,
      taskStatus: "ACTIVE",
      tags: { leadId },
    },
  });
}

export const leadEmailFlowRun = inngest.createFunction(
  {
    id: "lead-email-flow-run",
    name: "Lead Email Flow: £5 Assessment Upsell Sequence",
    triggers: [{ event: "leads/email-flow-start" }],
  },
  async ({ event, step }) => {
    const { flowId } = event.data as { flowId: string };

    for (let stepNumber = 1; stepNumber <= 3; stepNumber++) {
      const sendOutcome = await step.run(`send-step-${stepNumber}`, async () => {
        const flow = await prismadb.crm_LeadEmailFlow.findUnique({
          where: { id: flowId },
          include: { lead: true, steps: { where: { step_number: stepNumber } } },
        });

        if (!flow || flow.status !== "in_progress") {
          return { sent: false, reason: flow?.status || "not_found" };
        }

        const emailStep = flow.steps[0];
        if (!emailStep || !flow.lead.email) {
          return { sent: false, reason: "missing_step_or_email" };
        }

        const { fromAddress, replyTo } = await resolveSender(flow.lead_id);

        const result = await resend.emails.send({
          from: fromAddress,
          to: flow.lead.email,
          subject: emailStep.subject,
          html: emailStep.body,
          ...(replyTo ? { replyTo } : {}),
        });

        if (result.error) {
          return { sent: false, reason: result.error.message };
        }

        await prismadb.crm_LeadEmailFlowStep.update({
          where: { id: emailStep.id },
          data: { sent_at: new Date() },
        });

        return { sent: true, reason: null as string | null };
      });

      if (!sendOutcome.sent && sendOutcome.reason !== "not_found") {
        // Flow was stopped (customer already bought) or hit a transient
        // issue — either way, don't advance to the next step.
        if (sendOutcome.reason === "customer_bought" || sendOutcome.reason === "completed_no_purchase") {
          return { stopped: true, atStep: stepNumber };
        }
      }

      if (stepNumber < 3) {
        await step.sleep(`wait-after-step-${stepNumber}`, STEP_DELAY);
      }
    }

    await step.sleep("wait-final-grace-period", FINAL_GRACE_PERIOD);

    await step.run("finalize-flow", async () => {
      const flow = await prismadb.crm_LeadEmailFlow.findUnique({
        where: { id: flowId },
        include: { lead: true },
      });
      if (!flow || flow.status !== "in_progress") return { skipped: true };

      await prismadb.crm_LeadEmailFlow.update({
        where: { id: flowId },
        data: { status: "completed_no_purchase" },
      });

      if (flow.lead.assigned_to) {
        const leadLabel = `${flow.lead.firstName || ""} ${flow.lead.lastName}`.trim();
        await createFollowUpTask(flow.lead_id, flow.lead.assigned_to, leadLabel);
      }

      return { finalized: true };
    });

    return { completed: true };
  }
);
