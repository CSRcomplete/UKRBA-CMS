"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import NewTaskFromProject from "@/emails/NewTaskFromProject";
import resendHelper from "@/lib/resend";
import {
  requireAuthenticated,
  assertCanWriteBoard,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

import { GROUP_ASSIGNMENTS, LEGACY_KEY_MAP, ensureGroupSystemUser } from "@/lib/constants/group-assignments";

export const createTask = async (data: {
  title: string;
  user: string;
  board?: string | null;
  priority?: string | null;
  content?: string | null;
  dueDateAt?: Date;
  account?: string;
}) => {
  let authzUser;
  try {
    authzUser = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    throw e;
  }

  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  const { title, user, board, priority, content, dueDateAt } = data;

  if (!title || !title.trim() || !user || !user.trim()) {
    return { error: "Please provide a task title and assign it to a user or group." };
  }

  const finalPriority = priority && priority.trim() !== "" ? priority.trim() : "medium";
  const finalContent = content && content.trim() !== "" ? content.trim() : title.trim();

  // Resolve target board if not explicitly provided
  let targetBoard = board && board.trim() !== "" ? board.trim() : null;

  if (!targetBoard) {
    const firstBoard = await prismadb.boards.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (firstBoard) {
      targetBoard = firstBoard.id;
    } else {
      const newBoard = await prismadb.boards.create({
        data: {
          v: 0,
          title: "General Tasks",
          description: "General Tasks Board",
          user: session.user.id,
        },
      });
      targetBoard = newBoard.id;
    }
  }

  try {
    await assertCanWriteBoard(authzUser, targetBoard);
  } catch (e) {
    if (e instanceof AuthorizationError) {
      let userBoard = await prismadb.boards.findFirst({
        where: { user: session.user.id, deletedAt: null },
      });
      if (!userBoard) {
        userBoard = await prismadb.boards.create({
          data: {
            v: 0,
            title: "General Tasks",
            description: "General Tasks Board",
            user: session.user.id,
          },
        });
      }
      targetBoard = userBoard.id;
    } else {
      throw e;
    }
  }

  try {
    let sectionId = await prismadb.sections.findFirst({
      where: { board: targetBoard },
      orderBy: { position: "asc" },
    });

    if (!sectionId) {
      sectionId = await prismadb.sections.create({
        data: {
          v: 0,
          title: "To Do",
          board: targetBoard,
          position: 0,
        },
      });
    }

    const tasksCount = await prismadb.tasks.count({
      where: { section: sectionId.id },
    });

    const targetUserId = await ensureGroupSystemUser(user);

    const parsedDueDate = dueDateAt ? new Date(dueDateAt) : new Date();

    const createdTask = await prismadb.tasks.create({
      data: {
        v: 0,
        priority: finalPriority,
        title: title.trim(),
        content: finalContent,
        dueDateAt: parsedDueDate,
        section: sectionId.id,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        position: BigInt(tasksCount > 0 ? tasksCount : 0),
        user: targetUserId,
        taskStatus: "ACTIVE",
      },
    });

    if (targetBoard) {
      await prismadb.boards.update({
        where: { id: targetBoard },
        data: { updatedAt: new Date() },
      });
    }

    // Send email notification if assigning to a different user
    if (targetUserId !== session.user.id && createdTask) {
      try {
        let resend;
        try {
          resend = await resendHelper();
        } catch {
          resend = null;
        }

        if (resend) {
          const notifyRecipient = await prismadb.users.findUnique({
            where: { id: targetUserId },
          });

          const boardData = targetBoard
            ? await prismadb.boards.findUnique({
                where: { id: targetBoard },
              })
            : null;

          if (notifyRecipient?.email && !notifyRecipient.email.endsWith("@system.local")) {
            await resend.emails.send({
              from:
                process.env.NEXT_PUBLIC_APP_NAME +
                " <" +
                process.env.EMAIL_FROM +
                ">",
              to: notifyRecipient.email,
              subject:
                session.user.userLanguage === "en"
                  ? `New task - ${title}.`
                  : `Nový úkol - ${title}.`,
              text: "",
              react: NewTaskFromProject({
                taskFromUser: session.user.name!,
                username: notifyRecipient.name!,
                userLanguage: notifyRecipient.userLanguage!,
                taskData: createdTask,
                boardData,
              }),
            });
          }
        }
      } catch (emailError) {
        console.log("[CREATE_TASK_EMAIL]", emailError);
      }
    }

    revalidatePath("/[locale]/(routes)/projects", "page");
    return { success: true };
  } catch (error: any) {
    console.error("[CREATE_TASK]", error);
    return { error: error?.message || "Failed to create task" };
  }
};
