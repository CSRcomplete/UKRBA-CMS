"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TasksDataTable } from "./data-table";
import { columns } from "./columns";

type TaskStatus = "PENDING" | "ACTIVE" | "COMPLETE";

const TABS: { value: TaskStatus; label: string }[] = [
  { value: "PENDING", label: "Assigned" },
  { value: "ACTIVE", label: "In Progress" },
  { value: "COMPLETE", label: "Complete" },
];

export function TasksTabs({ tasks }: { tasks: any[] }) {
  const [status, setStatus] = useState<TaskStatus>("ACTIVE");

  const counts = useMemo(() => {
    const result: Record<TaskStatus, number> = { PENDING: 0, ACTIVE: 0, COMPLETE: 0 };
    for (const task of tasks) {
      const key = (task.taskStatus as TaskStatus) || "ACTIVE";
      if (key in result) result[key]++;
    }
    return result;
  }, [tasks]);

  const filteredTasks = useMemo(
    () => tasks.filter((task) => (task.taskStatus || "ACTIVE") === status),
    [tasks, status]
  );

  return (
    <div className="space-y-4">
      <Tabs value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.label}
              <span className="text-xs text-muted-foreground">({counts[tab.value]})</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <TasksDataTable data={filteredTasks} columns={columns} />
    </div>
  );
}
