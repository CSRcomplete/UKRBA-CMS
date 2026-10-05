import { prismadb } from "@/lib/prisma";
import { NextResponse } from "next/server";
import sendEmail from "@/lib/sendmail";

export async function POST(req: Request) {
  try {
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

    const userMap = new Map<string, typeof allUsers[0]>();
    allUsers.forEach(u => {
      userMap.set(u.id, u);
    });

    const processedEscalations: any[] = [];

    const processItem = async (
      id: string,
      type: "task" | "meeting",
      title: string,
      createdAt: Date | null,
      owner: { id: string; name: string | null; email: string; parentId: string | null } | null
    ) => {
      if (!createdAt || !owner) return;

      const daysElapsed = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (daysElapsed < 3) return;

      // Determine target recipient and level
      let currentTarget = userMap.get(owner.id);
      let escalationLevel = 0;
      let shouldEmail = false;

      if (daysElapsed === 3) {
        shouldEmail = true;
      } else if (daysElapsed >= 7 && (daysElapsed - 7) % 7 === 0) {
        escalationLevel = Math.floor((daysElapsed - 7) / 7) + 1;
        shouldEmail = true;

        // Traverse parent tree
        for (let i = 0; i < escalationLevel; i++) {
          if (currentTarget && currentTarget.parentId) {
            const parentUser = userMap.get(currentTarget.parentId);
            if (parentUser) {
              currentTarget = parentUser;
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }

      if (shouldEmail && currentTarget && currentTarget.email) {
        const subject = escalationLevel === 0
          ? `[ALERT] Overdue ${type}: ${title}`
          : `[ESCALATION L${escalationLevel}] Overdue ${type}: ${title}`;

        const recipientRoleName = currentTarget.role.replace("_", " ").toUpperCase();
        const text = escalationLevel === 0
          ? `Hello ${currentTarget.name || currentTarget.email},\n\nThis is an alert that your ${type} "${title}" has been active/scheduled for ${daysElapsed} days with no status changes. Please update its status as soon as possible.\n\nThank you,\nSystem Escalation Dispatcher`
          : `Hello ${currentTarget.name || currentTarget.email} (${recipientRoleName}),\n\nThis is an escalation notice (Level ${escalationLevel}) that the ${type} "${title}" originally owned by ${owner.name || owner.email} has been active/scheduled for ${daysElapsed} days with no status changes.\n\nPlease follow up on this item.\n\nThank you,\nSystem Escalation Dispatcher`;

        // Send email
        await sendEmail({
          from: process.env.EMAIL_FROM || "no-reply@ukrba-cms.com",
          to: currentTarget.email,
          subject,
          text
        });

        // Audit log
        await prismadb.sys_audit_logs.create({
          data: {
            entity_type: type === "task" ? "tasks" : "crm_Activities",
            entity_id: id,
            field_mutated: "escalation_alert_sent",
            old_value: "none",
            new_value: `Level ${escalationLevel} to ${currentTarget.email}`
          }
        });

        processedEscalations.push({
          id,
          type,
          title,
          daysElapsed,
          escalationLevel,
          alertedUser: currentTarget.email
        });
      }
    };

    // Run escalation checks
    for (const t of tasks) {
      await processItem(t.id, "task", t.title, t.createdAt, t.assigned_user);
    }
    for (const m of meetings) {
      await processItem(m.id, "meeting", m.title, m.createdAt, m.created_by_user);
    }

    return NextResponse.json({
      message: "Daily task and meeting escalation cron run complete",
      processed_count: processedEscalations.length,
      escalated_items: processedEscalations
    });
  } catch (error: any) {
    console.error("Escalation Cron Error:", error);
    return NextResponse.json({ message: "Cron internal failure" }, { status: 500 });
  }
}
