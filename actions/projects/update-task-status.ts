"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  requireAuthenticated,
  assertCanWriteTask,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";
import type { taskStatus as TaskStatus } from "@prisma/client";

export const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
  let authzUser;
  try {
    authzUser = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    throw e;
  }

  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  if (!taskId) return { error: "Missing task ID" };

  try {
    await assertCanWriteTask(authzUser, taskId);
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }

  try {
    const taskRecord = await prismadb.tasks.findUnique({
      where: { id: taskId },
      select: { tags: true },
    });

    const currentTags: Record<string, any> =
      taskRecord?.tags && typeof taskRecord.tags === "object" ? { ...(taskRecord.tags as Record<string, any>) } : {};

    if (status === "COMPLETE") {
      currentTags.completedAt = new Date().toISOString();
    } else {
      delete currentTags.completedAt;
    }

    await prismadb.tasks.update({
      where: { id: taskId },
      data: {
        taskStatus: status,
        updatedBy: session.user.id,
        tags: currentTags,
      },
    });

    revalidatePath("/[locale]/(routes)/projects", "page");
    return { success: true };
  } catch (error) {
    console.log("[UPDATE_TASK_STATUS]", error);
    return { error: "Failed to update task status" };
  }
};
