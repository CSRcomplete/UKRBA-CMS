import { cache } from "react";
import { prismadb } from "@/lib/prisma";
import {
  requireAuthenticated,
  leadReadScopeWhere,
  AuthenticationError,
} from "@/lib/authz";

export const getLeads = cache(async () => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    throw e;
  }

  const leadScope = await leadReadScopeWhere(user);
  const data = await prismadb.crm_Leads.findMany({
    where: { ...leadScope },
    include: {
      // Include assigned user (uses "LeadAssignedTo" relation)
      assigned_to_user: {
        select: {
          name: true,
        },
      },
      // Include assigned accounts
      assigned_accounts: true,
      // Include documents through DocumentsToLeads junction table
      documents: {
        include: {
          document: {
            select: {
              id: true,
              document_name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Fetch all active tasks to map next actions in-memory
  const activeTasks = await prismadb.tasks.findMany({
    where: {
      taskStatus: "ACTIVE",
    },
    orderBy: {
      dueDateAt: "asc",
    },
  });

  const leadsWithActions = data.map((lead: any) => {
    const nextTask = activeTasks.find((task: any) => {
      if (task.tags && typeof task.tags === "object") {
        return (task.tags as any).leadId === lead.id;
      }
      return false;
    });

    return {
      ...lead,
      nextAction: nextTask ? {
        title: nextTask.title,
        dueDateAt: nextTask.dueDateAt,
      } : null,
    };
  });

  return leadsWithActions;
});
