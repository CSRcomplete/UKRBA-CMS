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

export const markTaskDone = async (taskId: string) => {
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

    revalidatePath("/[locale]/(routes)/projects", "page");
    return { success: true };
  } catch (error) {
    console.log("[MARK_TASK_DONE]", error);
    return { error: "Failed to mark task as done" };
  }
};
