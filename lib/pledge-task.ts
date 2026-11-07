import { prismadb } from "@/lib/prisma";

/**
 * Creates a follow-up task for the owner of a newly ingested Pledge lead.
 * The task is created on behalf of the COO (Pete) so it shows "from Pete".
 * CEO / COO / admin / ops roles already see every user's tasks, so no extra
 * visibility handling is needed here.
 *
 * Never throws: a failure here must not fail lead ingestion.
 */
export async function createPledgeFollowUpTask(params: {
  leadId: string;
  assignedTo: string | null;
  leadLabel: string;
}): Promise<void> {
  const { leadId, assignedTo, leadLabel } = params;
  if (!assignedTo) return;

  try {
    // Prefer the COO named Pete; fall back to any COO user.
    const coos = await prismadb.users.findMany({
      where: { role: "coo" },
      select: { id: true, name: true },
    });
    const pete =
      coos.find((u) => (u.name || "").toLowerCase().includes("pete")) ?? coos[0];

    let board = await prismadb.boards.findFirst({
      where: { title: "CRM Tasks", deletedAt: null },
    });
    if (!board) {
      board = await prismadb.boards.findFirst({ where: { deletedAt: null } });
    }
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

    const position = await prismadb.tasks.count({ where: { section: section.id } });

    await prismadb.tasks.create({
      data: {
        v: 0,
        title: `New pledge: ${leadLabel}`,
        content:
          "A new business has taken the pledge. Please get in touch with them, follow up, and move them forward.",
        priority: "high",
        dueDateAt: new Date(),
        section: section.id,
        user: assignedTo,
        createdBy: pete?.id ?? null,
        updatedBy: pete?.id ?? null,
        position,
        taskStatus: "ACTIVE",
        tags: { leadId },
      },
    });
  } catch (error) {
    console.error("[PLEDGE_FOLLOW_UP_TASK]", error);
  }
}
