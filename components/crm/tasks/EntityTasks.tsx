"use client";

import React, { useState, useEffect, startTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserSearchCombobox } from "@/components/ui/user-search-combobox";
import { getTasksForEntity, createTaskForEntity, markEntityTaskDone } from "@/actions/projects/entity-tasks";
import { toast } from "sonner";
import moment from "moment";
import { CheckCircle, Clock, AlertTriangle, User, Plus, Check } from "lucide-react";

interface EntityTasksProps {
  entityId: string;
  entityType: "lead" | "member";
}

export function EntityTasks({ entityId, entityType }: EntityTasksProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState(moment().format("YYYY-MM-DD"));
  const [priority, setPriority] = useState("medium");
  const [assignedUser, setAssignedUser] = useState("");

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await getTasksForEntity(entityType, entityId);
      setTasks(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [entityId, entityType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }
    if (!assignedUser) {
      toast.error("Please assign an owner for the task");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createTaskForEntity({
        title,
        content,
        dueDateAt: new Date(dueDate),
        priority,
        assignedUser,
        entityType,
        entityId,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Task created successfully");
        setTitle("");
        setContent("");
        setDueDate(moment().format("YYYY-MM-DD"));
        setPriority("medium");
        setAssignedUser("");
        loadTasks();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDone = async (taskId: string) => {
    try {
      const result = await markEntityTaskDone(taskId, entityId, entityType);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Task marked as completed");
        loadTasks();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to complete task");
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p.toLowerCase()) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "high":
        return <Badge className="bg-orange-500 hover:bg-orange-600 text-white">High</Badge>;
      case "medium":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white">Medium</Badge>;
      default:
        return <Badge className="bg-gray-500 hover:bg-gray-600 text-white">Low</Badge>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Create Task Form */}
      <Card className="lg:col-span-1 shadow-sm border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add Next Action
          </CardTitle>
          <CardDescription>
            Schedule accountability tasks for this {entityType}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Title *</label>
              <Input
                placeholder="e.g., Follow up call, Send proposal"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Description</label>
              <Textarea
                placeholder="Details of the action..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Assign Owner *</label>
              <UserSearchCombobox
                value={assignedUser}
                onChange={setAssignedUser}
                placeholder="Search owner..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Due Date *</label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Task List */}
      <Card className="lg:col-span-2 shadow-sm border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Checklist & Action History</CardTitle>
          <CardDescription>
            Manage next actions and view past history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading actions...</div>
          ) : tasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg">
              No actions scheduled yet. Create one to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => {
                const isComplete = task.taskStatus === "COMPLETE";
                const isOverdue = !isComplete && moment(task.dueDateAt).isBefore(moment(), "day");
                const completedDate = task.tags?.completedAt;

                return (
                  <div
                    key={task.id}
                    className={`flex items-start justify-between p-4 rounded-lg border transition-colors ${
                      isComplete
                        ? "bg-muted/30 border-muted text-muted-foreground"
                        : isOverdue
                        ? "bg-destructive/5 border-destructive/20"
                        : "bg-card border-muted hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0 mr-4">
                      {!isComplete && (
                        <button
                          onClick={() => handleMarkDone(task.id)}
                          className="mt-1 flex-shrink-0 h-5 w-5 rounded-full border border-muted-foreground/30 hover:border-primary flex items-center justify-center text-transparent hover:text-primary transition-all"
                          title="Mark as Complete"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                      {isComplete && (
                        <CheckCircle className="mt-1 h-5 w-5 text-green-500 flex-shrink-0" />
                      )}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-semibold text-sm truncate ${isComplete ? "line-through" : ""}`}>
                            {task.title}
                          </p>
                          {getPriorityBadge(task.priority)}
                          {isOverdue && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Overdue
                            </Badge>
                          )}
                        </div>
                        {task.content && (
                          <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                            {task.content}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due: {moment(task.dueDateAt).format("MMM DD, YYYY")}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            Owner: {task.assigned_user?.name || "Unassigned"}
                          </span>
                          {isComplete && completedDate && (
                            <span className="text-green-600 font-medium">
                              Completed: {moment(completedDate).format("MMM DD, YYYY")}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
