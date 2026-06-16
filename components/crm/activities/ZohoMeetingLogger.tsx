"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { createActivity } from "@/actions/crm/activities/create-activity";
import { createTask } from "@/actions/crm/tasks/create-task";
import { useSession } from "@/lib/auth-client";

interface ZohoMeetingLoggerProps {
  leadId: string;
  onSaved?: () => void;
}

export function ZohoMeetingLogger({ leadId, onSaved }: ZohoMeetingLoggerProps) {
  const { data: session } = useSession();
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [outcome, setOutcome] = useState("Pending");
  const [notes, setNotes] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingDate || !meetingTime || !meetingLink) {
      toast.error("Please fill in Date, Time and Meeting URL");
      return;
    }

    try {
      const combinedDateTime = new Date(`${meetingDate}T${meetingTime}`);
      
      const payload = {
        type: "meeting" as const,
        title: `Zoho Meeting logged - Outcome: ${outcome}`,
        description: notes,
        date: combinedDateTime,
        outcome: outcome,
        status: "completed" as const,
        metadata: {
          meeting_link: meetingLink,
          follow_up_required: followUpRequired
        },
        links: [{ entityType: "lead", entityId: leadId }]
      };

      const res = await createActivity(payload);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Meeting details logged successfully!");

      if (followUpRequired) {
        // Enforce Automation Rule: open modal to force task creation
        setTaskTitle(`Follow up Zoho meeting - Lead ID ${leadId.slice(0, 8)}`);
        setTaskDesc(`Forced follow-up task triggered from meeting outcomes: ${notes}`);
        setTaskDueDate(new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16)); // Default 3 days out
        setShowTaskModal(true);
      } else {
        if (onSaved) onSaved();
      }

    } catch (err) {
      toast.error("Failed to log meeting outcomes");
    }
  };

  const handleCreateTask = async () => {
    if (!taskTitle || !taskDueDate) {
      toast.error("Task Title and Due Date are required");
      return;
    }

    try {
      if (!session?.user?.id) {
        toast.error("You must be logged in to create a task");
        return;
      }

      const res = await createTask({
        title: taskTitle,
        content: taskDesc,
        dueDateAt: new Date(taskDueDate),
        user: session.user.id,
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success("Follow-up task created successfully!");
      setShowTaskModal(false);
      
      // Reset form fields
      setMeetingDate("");
      setMeetingTime("");
      setMeetingLink("");
      setNotes("");
      setFollowUpRequired(false);
      
      if (onSaved) onSaved();
    } catch (err) {
      toast.error("Failed to generate follow-up task");
    }
  };

  return (
    <div className="space-y-4 mt-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-md">Zoho Meeting Logger (Phase 1)</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveMeeting} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Meeting Date</Label>
                <Input type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label>Meeting Time</Label>
                <Input type="time" value={meetingTime} onChange={(e) => setMeetingTime(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Meeting URL Link</Label>
              <Input type="url" placeholder="https://zoho.meeting/..." value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} required />
            </div>

            <div className="space-y-1">
              <Label>Outcome Status</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed - Converted">Completed - Converted</SelectItem>
                  <SelectItem value="Completed - Follow-Up Required">Completed - Follow-Up Required</SelectItem>
                  <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                  <SelectItem value="No Show / Cancelled">No Show / Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Meeting Notes</Label>
              <Textarea rows={3} placeholder="Key meeting details..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="followUp" checked={followUpRequired} onCheckedChange={(checked) => setFollowUpRequired(!!checked)} />
              <Label htmlFor="followUp" className="cursor-pointer">Follow Up Required (Triggers Forced Task Creation)</Label>
            </div>

            <Button type="submit" className="w-full">Log Zoho Meeting</Button>
          </form>
        </CardContent>
      </Card>

      {/* Forced Task Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-amber-500">⚠️ Follow-Up Task Required</DialogTitle>
            <DialogDescription>
              This meeting was marked as requiring follow-up action. You must create a valid task now.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Task Title</Label>
              <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Description Details</Label>
              <Textarea rows={3} value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Future Due Date</Label>
              <Input type="datetime-local" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} required />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateTask}>Create Task & Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
