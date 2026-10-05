"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const getTasksForEntity = async (entityType: "lead" | "member", entityId: string) => {
  const session = await getSession();
  if (!session) return [];

  const tasks = await prismadb.tasks.findMany({
    include: {
      assigned_user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Filter tasks where tags contains the corresponding entityId
  return tasks.filter((task: any) => {
    if (task.tags && typeof task.tags === "object") {
      const tags = task.tags as Record<string, any>;
      if (entityType === "lead") {
        return tags.leadId === entityId;
      } else if (entityType === "member") {
        return tags.memberId === entityId;
      }
    }
    return false;
  });
};

export const createTaskForEntity = async (data: {
  title: string;
  content: string;
  dueDateAt: Date;
  priority: string;
  assignedUser: string;
  entityType: "lead" | "member";
  entityId: string;
}) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const { title, content, dueDateAt, priority, assignedUser, entityType, entityId } = data;

  if (!title || !priority || !assignedUser) {
    return { error: "Missing required fields" };
  }

  try {
    // 1. Get or create a default Board for CRM tasks
    let board = await prismadb.boards.findFirst({
      where: { deletedAt: null },
    });

    if (!board) {
      board = await prismadb.boards.create({
        data: {
          v: 0,
          title: "CRM Tasks",
          description: "Default board for Lead and Member actions",
          createdBy: session.user.id,
          updatedBy: session.user.id,
        },
      });
    }

    // 2. Get or create a default Section for the Board
    let section = await prismadb.sections.findFirst({
      where: { board: board.id },
      orderBy: { position: "asc" },
    });

    if (!section) {
      section = await prismadb.sections.create({
        data: {
          v: 0,
          title: "To Do",
          board: board.id,
          position: 0,
        },
      });
    }

    // 3. Count existing tasks in that section to position the task
    const tasksCount = await prismadb.tasks.count({
      where: { section: section.id },
    });

    // 4. Set the tag metadata
    const tags: Record<string, any> = {};
    if (entityType === "lead") {
      tags.leadId = entityId;
    } else {
      tags.memberId = entityId;
    }

    await prismadb.tasks.create({
      data: {
        v: 0,
        title,
        content,
        priority,
        dueDateAt,
        section: section.id,
        user: assignedUser,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        position: tasksCount,
        taskStatus: "ACTIVE",
        tags,
      },
    });

    revalidatePath(`/[locale]/(routes)/crm/leads/${entityId}`, "page");
    revalidatePath(`/[locale]/(routes)/crm/members/${entityId}`, "page");
    revalidatePath("/[locale]/(routes)/crm/leads", "page");
    revalidatePath("/[locale]/(routes)/crm/members", "page");

    return { success: true };
  } catch (error) {
    console.log("[CREATE_ENTITY_TASK]", error);
    return { error: "Failed to create task" };
  }
};

export const markEntityTaskDone = async (taskId: string, entityId: string, entityType: "lead" | "member") => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    const taskRecord = await prismadb.tasks.findUnique({
      where: { id: taskId },
      select: { tags: true },
    });

    let currentTags = {};
    if (taskRecord?.tags && typeof taskRecord.tags === "object") {
      currentTags = taskRecord.tags;
    }

    await prismadb.tasks.update({
      where: { id: taskId },
      data: {
        taskStatus: "COMPLETE",
        updatedBy: session.user.id,
        tags: {
          ...currentTags,
          completedAt: new Date().toISOString(),
        },
      },
    });

    revalidatePath(`/[locale]/(routes)/crm/leads/${entityId}`, "page");
    revalidatePath(`/[locale]/(routes)/crm/members/${entityId}`, "page");
    revalidatePath("/[locale]/(routes)/crm/leads", "page");
    revalidatePath("/[locale]/(routes)/crm/members", "page");

    return { success: true };
  } catch (error) {
    console.log("[MARK_ENTITY_TASK_DONE]", error);
    return { error: "Failed to mark task as done" };
  }
};
