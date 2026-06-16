import { prismadb } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. Fetch threshold configuration from system settings
    const thresholdSetting = await prismadb.crm_SystemSettings.findUnique({
      where: { key: "escalation_thresholds" }
    });

    const thresholds: number[] = thresholdSetting 
      ? JSON.parse(thresholdSetting.value) 
      : [3, 7, 14, 21, 30];

    const [d1, d2, d3, d4, d5] = thresholds;

    // 2. Fetch overdue pending tasks
    const tasks = await prismadb.tasks.findMany({
      where: {
        taskStatus: "ACTIVE", // Pending tasks
        dueDateAt: {
          lt: new Date()
        }
      },
      include: {
        assigned_user: true
      }
    });

    const processedEscalations = [];

    // Resolve managers / supervisor positions
    const ceoUser = await prismadb.users.findFirst({
      where: { email: { contains: "ceo", mode: "insensitive" } }
    });
    
    const opsDirector = await prismadb.users.findFirst({
      where: {
        OR: [
          { name: { contains: "Operations", mode: "insensitive" } },
          { email: { contains: "ops", mode: "insensitive" } }
        ]
      }
    });

    for (const task of tasks) {
      if (!task.dueDateAt) continue;

      const deltaMs = Date.now() - new Date(task.dueDateAt).getTime();
      const D = Math.floor(deltaMs / (1000 * 60 * 60 * 24));

      // Get current owner / assignee
      const owner = task.assigned_user;
      let targetOwnerId: string | null = task.user;
      let ruleApplied = "";

      // Escalation rules progression
      if (D >= d5) {
        // Escalate to CEO
        if (ceoUser) {
          targetOwnerId = ceoUser.id;
          ruleApplied = `D >= ${d5} (CEO)`;
        }
      } else if (D >= d4) {
        // Escalate to Operations Director
        if (opsDirector) {
          targetOwnerId = opsDirector.id;
          ruleApplied = `D >= ${d4} (Operations Director)`;
        }
      } else if (D >= d3 && owner) {
        // Escalate to Regional Director (e.g. parent of area director or region_id based lookup)
        if (owner.parentId) {
          const supervisor = await prismadb.users.findUnique({ where: { id: owner.parentId } });
          if (supervisor && supervisor.parentId) {
            targetOwnerId = supervisor.parentId; // Escalated up the tree
            ruleApplied = `D >= ${d3} (Regional Director)`;
          }
        }
      } else if (D >= d2 && owner) {
        // Escalate to Area Director (immediate supervisor / parent)
        if (owner.parentId) {
          targetOwnerId = owner.parentId;
          ruleApplied = `D >= ${d2} (Area Director)`;
        }
      } else if (D >= d1) {
        // Trigger alert email to task owner
        ruleApplied = `D >= ${d1} (Owner Alert)`;
      }

      if (ruleApplied && targetOwnerId !== task.user) {
        // Update task owner in database
        const updatedTask = await prismadb.tasks.update({
          where: { id: task.id },
          data: {
            user: targetOwnerId
          }
        });

        // Write to CDC log
        await prismadb.sys_audit_logs.create({
          data: {
            entity_type: "tasks",
            entity_id: task.id,
            field_mutated: "user",
            old_value: task.user || "null",
            new_value: targetOwnerId || "null"
          }
        });

        processedEscalations.push({
          task_id: task.id,
          title: task.title,
          days_overdue: D,
          rule: ruleApplied,
          escalated_to: targetOwnerId
        });
      }
    }

    return NextResponse.json({
      message: "Daily task escalation cron run complete",
      processed_count: processedEscalations.length,
      escalated_tasks: processedEscalations
    });
  } catch (error: any) {
    console.error("Escalation Cron Error:", error);
    return NextResponse.json({ message: "Cron internal failure" }, { status: 500 });
  }
}
