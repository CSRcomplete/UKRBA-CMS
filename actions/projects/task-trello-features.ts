"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
}

export async function updateTaskDescription(taskId: string, content: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (!taskId) return { error: "Missing Task ID" };

  try {
    const updated = await prismadb.tasks.update({
      where: { id: taskId },
      data: {
        content,
        updatedBy: session.user.id,
      },
    });

    revalidatePath("/[locale]/(routes)/projects", "page");
    return { success: true, task: updated };
  } catch (err) {
    console.error("[UPDATE_TASK_DESCRIPTION]", err);
    return { error: "Failed to update task description" };
  }
}

export async function updateTaskChecklist(taskId: string, checklist: ChecklistItem[]) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  if (!taskId) return { error: "Missing Task ID" };

  try {
    const existingTask = await prismadb.tasks.findUnique({
      where: { id: taskId },
      select: { tags: true },
    });

    const currentTags = (existingTask?.tags as Record<string, any>) || {};
    const updatedTags = {
      ...currentTags,
      checklist,
    };

    const updated = await prismadb.tasks.update({
      where: { id: taskId },
      data: {
        tags: updatedTags as any,
        updatedBy: session.user.id,
      },
    });

    revalidatePath("/[locale]/(routes)/projects", "page");
    return { success: true, checklist };
  } catch (err) {
    console.error("[UPDATE_TASK_CHECKLIST]", err);
    return { error: "Failed to update task checklist" };
  }
}
