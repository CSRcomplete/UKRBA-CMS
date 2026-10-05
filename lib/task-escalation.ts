import { prismadb } from "./prisma";

export interface EscalationAlert {
  id: string;
  type: "task" | "meeting";
  title: string;
  createdAt: Date;
  daysElapsed: number;
  originalOwnerId: string;
  originalOwnerName: string;
  originalOwnerEmail: string;
  escalationLevel: number;
  currentAlertTargetId: string;
}

export async function getEscalationAlerts(userId: string): Promise<EscalationAlert[]> {
  // 1. Fetch active/pending tasks
  const tasks = await prismadb.tasks.findMany({
    where: {
      taskStatus: {
        in: ["ACTIVE", "PENDING"]
      }
    },
    include: {
      assigned_user: {
        select: {
          id: true,
          name: true,
          email: true,
          parentId: true,
        }
      }
    }
  });

  // 2. Fetch scheduled meetings
  const meetings = await prismadb.crm_Activities.findMany({
    where: {
      type: "meeting",
      status: "scheduled",
      deletedAt: null
    },
    include: {
      created_by_user: {
        select: {
          id: true,
          name: true,
          email: true,
          parentId: true,
        }
      }
    }
  });

  // 3. Fetch all active users to build hierarchy cache
  const allUsers = await prismadb.users.findMany({
    where: {
      userStatus: "ACTIVE"
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      parentId: true,
    }
  });

  // Create a map of users by ID for easy hierarchy climbing
  const userMap = new Map<string, typeof allUsers[0]>();
  allUsers.forEach(u => {
    userMap.set(u.id, u);
  });

  const alerts: EscalationAlert[] = [];

  const processItem = (
    id: string,
    type: "task" | "meeting",
    title: string,
    createdAt: Date | null,
    owner: { id: string; name: string | null; email: string; parentId: string | null } | null
  ) => {
    if (!createdAt || !owner) return;

    const daysElapsed = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    if (daysElapsed < 3) return;

    // Determine target recipient
    let currentTarget = userMap.get(owner.id);
    let escalationLevel = 0;

    if (daysElapsed >= 7) {
      escalationLevel = Math.floor((daysElapsed - 7) / 7) + 1;
      
      // Traverse up parent hierarchy escalationLevel times
      for (let i = 0; i < escalationLevel; i++) {
        if (currentTarget && currentTarget.parentId) {
          const parentUser = userMap.get(currentTarget.parentId);
          if (parentUser) {
            currentTarget = parentUser;
          } else {
            break; // Stop if parent doesn't exist in map
          }
        } else {
          break; // Stop if parentId is null
        }
      }
    }

    if (currentTarget) {
      alerts.push({
        id,
        type,
        title,
        createdAt,
        daysElapsed,
        originalOwnerId: owner.id,
        originalOwnerName: owner.name || owner.email,
        originalOwnerEmail: owner.email,
        escalationLevel,
        currentAlertTargetId: currentTarget.id,
      });
    }
  };

  // Process tasks
  tasks.forEach(t => {
    processItem(t.id, "task", t.title, t.createdAt, t.assigned_user);
  });

  // Process meetings
  meetings.forEach(m => {
    processItem(m.id, "meeting", m.title, m.createdAt, m.created_by_user);
  });

  // Filter alerts where the current target is the logged-in user
  return alerts.filter(a => a.currentAlertTargetId === userId);
}
