"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateMeeting } from "@/actions/crm/meetings";
import moment from "moment";

type EditableMeeting = {
  id: string;
  title: string;
  description?: string | null;
  date: Date;
  duration?: number | null;
  meetingType?: "video" | "phone" | "in_person";
  location?: string | null;
};

export function EditMeetingDialog({
  meeting,
  open,
  onOpenChange,
}: {
  meeting: EditableMeeting;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(meeting.title);
  const [description, setDescription] = useState(meeting.description || "");
  const [dateStr, setDateStr] = useState(moment(meeting.date).format("YYYY-MM-DDTHH:mm"));
  const [duration, setDuration] = useState(meeting.duration || 30);
  const [location, setLocation] = useState(meeting.location || "");
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || !dateStr) {
      toast.error("Title and date/time are required");
      return;
    }
    setSubmitting(true);
    try {
      const result = await updateMeeting(meeting.id, {
        title: title.trim(),
        description,
        date: new Date(dateStr),
        duration,
        location: meeting.meetingType !== "video" ? location : undefined,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Meeting updated");
        onOpenChange(false);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Meeting</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Description / Agenda</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Date &amp; Time</Label>
              <Input
                type="datetime-local"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Duration (mins)</Label>
              <Input
                type="number"
                min={5}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10) || 30)}
              />
            </div>
          </div>
          {meeting.meetingType !== "video" && (
            <div className="space-y-1">
              <Label className="text-xs">
                {meeting.meetingType === "phone" ? "Phone Details" : "Location / Venue"}
              </Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={submitting}>
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
