import { prismadb } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  requireAuthenticated,
  boardReadScopeWhere,
  getAccessibleUserIds,
  AuthenticationError,
} from "@/lib/authz";

// Roles with unrestricted visibility into every task, matching the same
// tier already used for contacts/targets elsewhere in this app.
const FULL_TASK_ACCESS_ROLES = ["admin", "ceo", "coo", "operations_director", "manager"];

export const getTasks = async () => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    throw e;
  }

  const scope = await boardReadScopeWhere(user);
  const where: Prisma.TasksWhereInput = {
    assigned_section: {
      board_relation: scope,
    },
  };

  // Board access is about shared Kanban workspaces, not who a task actually
  // belongs to — a Regional/Area Director should only see tasks assigned
  // to themselves or the staff they supervise, even on a board they can
  // otherwise see.
  if (!FULL_TASK_ACCESS_ROLES.includes(user.role)) {
    const accessibleUserIds = await getAccessibleUserIds(user);
    where.user = { in: accessibleUserIds };
  }

  const data = await prismadb.tasks.findMany({
    where,
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
  return data;
};

//get tasks by month for chart
export const getTasksByMonth = async () => {
  const tasks = await prismadb.tasks.findMany({
    select: {
      createdAt: true,
    },
  });

  if (!tasks) {
    return {};
  }

  const tasksByMonth = tasks.reduce((acc: any, task: any) => {
    const month = new Date(task.createdAt).toLocaleString("default", {
      month: "long",
    });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(tasksByMonth).map((month: any) => {
    return {
      name: month,
      Number: tasksByMonth[month],
    };
  });

  return chartData;
};
