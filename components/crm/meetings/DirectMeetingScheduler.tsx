"use client";

import React, { useState } from "react";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { scheduleMeeting } from "@/actions/crm/meetings";
import moment from "moment";
import { Calendar } from "lucide-react";

interface DirectMeetingSchedulerProps {
  inviteeType: "user" | "lead";
  inviteeId: string;
  inviteeName: string;
}

export function DirectMeetingScheduler({ inviteeType, inviteeId, inviteeName }: DirectMeetingSchedulerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(moment().add(1, "days").format("YYYY-MM-DDTHH:mm"));
  const [duration, setDuration] = useState("30");
  const [meetingLink, setMeetingLink] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Meeting title is required");
      return;
    }

    setLoading(true);
    try {
      const result = await scheduleMeeting({
        title,
        description,
        date: new Date(date),
        duration: duration ? parseInt(duration, 10) : undefined,
        meetingLink: meetingLink || undefined,
        inviteeType,
        inviteeId,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Meeting scheduled successfully!");
        setTitle("");
        setDescription("");
        setMeetingLink("");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Schedule Meeting with {inviteeName}
        </CardTitle>
        <CardDescription>
          Schedule a direct meeting. An email notification will be sent to the invitee with meeting details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Meeting Title *</label>
            <Input
              placeholder="e.g., Q3 Strategy Review, Introduction Call"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Date & Time *</label>
              <Input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Duration (minutes)</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Zoho/Zoom Meeting Link</label>
            <Input
              type="url"
              placeholder="e.g. https://meeting.zoho.com/meeting/..."
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Meeting Agenda / Notes</label>
            <Textarea
              placeholder="Provide meeting context or agenda items..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full mt-2" disabled={loading}>
            {loading ? "Scheduling..." : "Schedule Meeting"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
