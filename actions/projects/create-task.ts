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

import { GROUP_ASSIGNMENTS, LEGACY_KEY_MAP } from "@/lib/constants/group-assignments";

async function ensureGroupSystemUser(rawUserId: string) {
  const targetId = LEGACY_KEY_MAP[rawUserId] || rawUserId;
  const group = GROUP_ASSIGNMENTS.find((g) => g.id === targetId);

  if (group) {
    await prismadb.users.upsert({
      where: { id: group.id },
      update: { name: group.name },
      create: {
        id: group.id,
        v: 0,
        email: `group_${group.id.slice(0, 8)}@system.local`,
        name: group.name,
        userStatus: "ACTIVE",
      },
    });
  }

  return targetId;
}

export const createTask = async (data: {
  title: string;
  user: string;
  board?: string | null;
  priority: string;
  content: string;
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

  if (!title || !user || !priority || !content) {
    return { error: "Missing one of the task data" };
  }

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
        priority: priority || "normal",
        title,
        content: content || title,
        dueDateAt: parsedDueDate,
        section: sectionId.id,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        position: tasksCount > 0 ? tasksCount : 0,
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
    if (user !== session.user.id && createdTask) {
      try {
        let resend;
        try {
          resend = await resendHelper();
        } catch {
          resend = null;
        }

        if (resend) {
          const notifyRecipient = await prismadb.users.findUnique({
            where: { id: user },
          });

          const boardData = targetBoard
            ? await prismadb.boards.findUnique({
                where: { id: targetBoard },
              })
            : null;

          if (notifyRecipient?.email) {
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
  } catch (error) {
    console.log("[CREATE_TASK]", error);
    return { error: "Failed to create task" };
  }
};
