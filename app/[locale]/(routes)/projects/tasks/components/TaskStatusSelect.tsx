"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { statuses } from "../data/data";
import { updateTaskStatus } from "@/actions/projects/update-task-status";

type TaskStatusValue = "PENDING" | "ACTIVE" | "COMPLETE";

export function TaskStatusSelect({
  taskId,
  status,
}: {
  taskId: string;
  status: TaskStatusValue;
}) {
  const router = useRouter();
  const [value, setValue] = useState<TaskStatusValue>(status);
  const [isPending, startTransition] = useTransition();

  const handleChange = (next: string) => {
    const previous = value;
    setValue(next as TaskStatusValue);
    startTransition(async () => {
      const result = await updateTaskStatus(taskId, next as TaskStatusValue);
      if (result?.error) {
        setValue(previous);
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <Select value={value} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger
        className="h-8 w-[130px] text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent onClick={(e) => e.stopPropagation()}>
        {statuses.map((s) => (
          <SelectItem key={s.value} value={s.value} className="text-xs">
            <span className="flex items-center gap-1.5">
              <s.icon className="h-3.5 w-3.5 text-muted-foreground" />
              {s.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
