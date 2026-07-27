"use server";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import NewTaskCommentEmail from "@/emails/NewTaskComment";
import resendHelper from "@/lib/resend";
import {
  requireAuthenticated,
  assertCanWriteBoard,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const addCommentToTask = async (data: {
  taskId: string;
  comment: string;
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

  const { taskId, comment } = data;
  if (!taskId) return { error: "Missing task ID" };
  if (!comment || !comment.trim()) return { error: "Missing comment text" };

  // Resolve parent board (if any) via assigned_section relation for scope check.
  const taskBoardLookup = await prismadb.tasks.findUnique({
    where: { id: taskId },
    select: {
      assigned_section: { select: { board_relation: { select: { id: true } } } },
    },
  });
  const parentBoardId =
    taskBoardLookup?.assigned_section?.board_relation?.id;
  if (parentBoardId) {
    try {
      await assertCanWriteBoard(authzUser, parentBoardId);
    } catch (e) {
      if (e instanceof AuthorizationError) return { error: "Forbidden" };
      throw e;
    }
  }

  try {
    const task = await prismadb.tasks.findUnique({
      where: { id: taskId },
    });

    if (!task) return { error: "Task not found" };

    const section = task.section
      ? await prismadb.sections.findUnique({
          where: { id: task.section },
        })
      : null;

    if (section) {
      // Task from Projects module - add user as board watcher safely
      try {
        const isWatching = await prismadb.boardWatchers.findUnique({
          where: {
            board_id_user_id: {
              board_id: section.board,
              user_id: session.user.id,
            },
          },
        });

        if (!isWatching) {
          await prismadb.boardWatchers.create({
            data: {
              board_id: section.board,
              user_id: session.user.id,
            },
          });
        }
      } catch {
        // Silently ignore if already a watcher or unique constraint conflict
      }
    }

    const newComment = await prismadb.tasksComments.create({
      data: {
        v: 0,
        comment: comment.trim(),
        task: taskId,
        user: session.user.id,
      },
    });

    if (section) {
      // Send email to all board watchers except the commenter
      try {
        let resend;
        try {
          resend = await resendHelper();
        } catch {
          resend = null;
        }

        if (resend) {
          const boardWatchers = await prismadb.boardWatchers.findMany({
            where: {
              board_id: section.board,
              user_id: { not: session.user.id },
            },
            include: { user: true },
          });

          const emailRecipients = boardWatchers
            .map((w: (typeof boardWatchers)[number]) => w.user)
            .filter((u: any) => u && u.email && !u.email.endsWith("@system.local"));

          // Also add task creator if different from commenter and valid user
          if (task.createdBy && !task.createdBy.startsWith("00000000-")) {
            const taskCreator = await prismadb.users.findUnique({
              where: { id: task.createdBy },
            });
            if (
              taskCreator &&
              taskCreator.id !== session.user.id &&
              taskCreator.email &&
              !taskCreator.email.endsWith("@system.local")
            ) {
              if (!emailRecipients.some((r: any) => r.id === taskCreator.id)) {
                emailRecipients.push(taskCreator);
              }
            }
          }

          for (const user of emailRecipients) {
            try {
              await resend.emails.send({
                from:
                  process.env.NEXT_PUBLIC_APP_NAME +
                  " <" +
                  process.env.EMAIL_FROM +
                  ">",
                to: user.email,
                subject:
                  session.user.userLanguage === "en"
                    ? `New comment on task ${task.title}.`
                    : `Nový komentář k úkolu ${task.title}.`,
                text: "",
                react: NewTaskCommentEmail({
                  commentFromUser: session.user.name!,
                  username: user.name || user.email,
                  userLanguage: user.userLanguage || "en",
                  taskId: task.id,
                  comment,
                }),
              });
            } catch {
              // Ignore single recipient email failure
            }
          }
        }
      } catch (emailError) {
        console.log("[ADD_COMMENT_EMAIL]", emailError);
      }
    }

    revalidatePath("/[locale]/(routes)/projects", "page");
    return { data: newComment };
  } catch (error: any) {
    console.error("[ADD_COMMENT_TO_TASK]", error);
    return { error: error?.message || "Failed to add comment" };
  }
};
