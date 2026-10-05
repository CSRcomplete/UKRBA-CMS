"use server";

import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuthenticated, AuthenticationError } from "@/lib/authz";

export interface UploadTaskDocumentInput {
  taskId: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  description?: string;
}

export async function uploadTaskDocument(input: UploadTaskDocumentInput) {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    throw e;
  }

  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const { taskId, name, url, size, mimeType, description } = input;
  if (!taskId || !name || !url) {
    return { error: "Missing required document data" };
  }

  try {
    const document = await prismadb.documents.create({
      data: {
        v: 0,
        document_name: name,
        description: description || "Task Document",
        document_file_url: url,
        key: `task-docs/${Date.now()}-${name.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
        size: size || 0,
        document_file_mimeType: mimeType || "application/octet-stream",
        createdBy: user.id,
        created_by_user: user.id,
        assigned_user: user.id,
        visibility: "repository",
      },
    });

    await prismadb.documentsToTasks.create({
      data: {
        document_id: document.id,
        task_id: taskId,
      },
    });

    await prismadb.tasks.update({
      where: { id: taskId },
      data: { updatedBy: user.id },
    });

    revalidatePath("/[locale]/(routes)/projects", "page");
    return { success: true, document };
  } catch (error) {
    console.error("[UPLOAD_TASK_DOCUMENT]", error);
    return { error: "Failed to upload document to task" };
  }
}
