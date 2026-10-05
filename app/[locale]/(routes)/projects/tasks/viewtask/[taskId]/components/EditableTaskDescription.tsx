"use client";

import React, { useState } from "react";
import { AlignLeft, Edit3, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { updateTaskDescription } from "@/actions/projects/task-trello-features";

interface EditableTaskDescriptionProps {
  taskId: string;
  initialContent: string | null;
}

export function EditableTaskDescription({
  taskId,
  initialContent,
}: EditableTaskDescriptionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(initialContent || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await updateTaskDescription(taskId, content);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Description updated!");
        setIsEditing(false);
      }
    } catch {
      toast.error("Failed to update description");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setContent(initialContent || "");
    setIsEditing(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-base font-semibold flex items-center gap-2 text-foreground">
          <AlignLeft className="h-4 w-4 text-violet-600" />
          Description
        </h4>
        {!isEditing && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-8 text-xs text-muted-foreground hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950"
          >
            <Edit3 className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3 pt-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a more detailed description..."
            className="min-h-[120px] text-sm focus-visible:ring-violet-500 bg-background"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-violet-600 hover:bg-violet-700 text-white text-xs"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  Save
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={isSaving}
              className="text-xs"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className={`rounded-lg border p-3.5 text-sm transition-all cursor-pointer hover:border-violet-300 hover:bg-accent/40 ${
            content
              ? "bg-card text-foreground whitespace-pre-wrap leading-relaxed"
              : "bg-muted/20 text-muted-foreground italic"
          }`}
        >
          {content || "Add a more detailed description..."}
        </div>
      )}
    </div>
  );
}
