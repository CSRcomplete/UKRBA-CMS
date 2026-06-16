"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const createTask = async (data: {
  title: string;
  content: string;
  dueDateAt: Date;
  user: string;
}) => {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const { title, content, dueDateAt, user } = data;

  if (!title || !dueDateAt || !user) {
    return { error: "Missing required fields" };
  }

  try {
    // Find first section in any board to assign the task to if needed, or default section
    const defaultSection = await prismadb.sections.findFirst();

    const task = await prismadb.tasks.create({
      data: {
        v: 0,
        title,
        content,
        dueDateAt,
        priority: "normal",
        section: defaultSection?.id || "",
        createdBy: session.user.id,
        updatedBy: session.user.id,
        position: 0,
        user,
        taskStatus: "ACTIVE",
      },
    });

    // Write to CDC log
    await prismadb.sys_audit_logs.create({
      data: {
        entity_type: "tasks",
        entity_id: task.id,
        field_mutated: "ALL",
        new_value: JSON.stringify({ id: task.id, title, user })
      }
    });

    revalidatePath("/[locale]/(routes)/projects", "page");
    return { success: true, task };
  } catch (error) {
    console.log("[CREATE_CRM_TASK_ERROR]", error);
    return { error: "Failed to create task" };
  }
};
