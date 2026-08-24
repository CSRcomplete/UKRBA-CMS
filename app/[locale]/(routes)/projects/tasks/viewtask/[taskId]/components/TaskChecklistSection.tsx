"use client";

import React, { useState } from "react";
import { CheckSquare, Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  updateTaskChecklist,
  ChecklistItem,
} from "@/actions/projects/task-trello-features";

interface TaskChecklistSectionProps {
  taskId: string;
  initialChecklist: ChecklistItem[];
}

export function TaskChecklistSection({
  taskId,
  initialChecklist = [],
}: TaskChecklistSectionProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initialChecklist);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Compute progress percentage
  const totalItems = items.length;
  const completedItems = items.filter((i) => i.isCompleted).length;
  const progressPercent =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Sync checklist with server
  const saveChecklist = async (updatedItems: ChecklistItem[]) => {
    setItems(updatedItems);
    setIsSaving(true);
    try {
      const res = await updateTaskChecklist(taskId, updatedItems);
      if (res.error) {
        toast.error(res.error);
      }
    } catch {
      toast.error("Failed to save checklist item");
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle item status
  const handleToggle = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    );
    saveChecklist(updated);
  };

  // Add new checklist item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const newItem: ChecklistItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newItemTitle.trim(),
      isCompleted: false,
    };

    const updated = [...items, newItem];
    saveChecklist(updated);
    setNewItemTitle("");
    setIsAdding(false);
  };

  // Delete checklist item
  const handleDeleteItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    saveChecklist(updated);
  };

  return (
    <div className="space-y-4 my-6 p-4 rounded-xl border border-border/60 bg-card/60 shadow-sm">
      {/* Header & Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold flex items-center gap-2 text-foreground">
            <CheckSquare className="h-4.5 w-4.5 text-emerald-600" />
            Checklist
          </h4>
          <span className="text-xs font-semibold text-muted-foreground">
            {completedItems} of {totalItems} ({progressPercent}%)
          </span>
        </div>

        {totalItems > 0 && (
          <div className="space-y-1">
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={`h-full transition-all duration-500 ${
                  progressPercent === 100
                    ? "bg-emerald-500"
                    : progressPercent > 50
                    ? "bg-violet-600"
                    : "bg-blue-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Checklist Items List */}
      <div className="space-y-1.5 pt-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex items-start justify-between rounded-lg p-2 transition-colors hover:bg-accent/50"
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Checkbox
                checked={item.isCompleted}
                onCheckedChange={() => handleToggle(item.id)}
                className="h-4.5 w-4.5 mt-0.5 shrink-0 rounded border-muted-foreground/40 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <span
                className={`text-sm whitespace-normal break-words select-none transition-all ${
                  item.isCompleted
                    ? "line-through text-muted-foreground/70"
                    : "text-foreground font-medium"
                }`}
              >
                {item.title}
              </span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteItem(item.id)}
              className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-opacity"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add Item Form */}
      {isAdding ? (
        <form onSubmit={handleAddItem} className="space-y-2 pt-2">
          <Input
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Add an item..."
            autoFocus
            className="text-sm focus-visible:ring-violet-500"
          />
          <div className="flex items-center gap-2">
            <Button
              type="submit"
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white text-xs h-8"
            >
              Add Item
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewItemTitle("");
              }}
              className="text-xs h-8"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
          className="mt-2 text-xs border-dashed text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add an item
        </Button>
      )}
    </div>
  );
}
