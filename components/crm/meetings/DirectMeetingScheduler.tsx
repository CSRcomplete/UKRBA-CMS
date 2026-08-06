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
import { Calendar, Video, Phone, Users, MapPin } from "lucide-react";

interface DirectMeetingSchedulerProps {
  inviteeType: "user" | "lead";
  inviteeId: string;
  inviteeName: string;
}

export function DirectMeetingScheduler({ inviteeType, inviteeId, inviteeName }: DirectMeetingSchedulerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [meetingType, setMeetingType] = useState<"video" | "phone" | "in_person">("video");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(moment().add(1, "days").format("YYYY-MM-DDTHH:mm"));
  const [duration, setDuration] = useState("30");

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
        inviteeType,
        inviteeId,
        meetingType,
        location,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        const msg = meetingType === "video"
          ? "Meeting scheduled! Zoom meeting created and invitation email sent."
          : `${meetingType === "phone" ? "Phone call" : "Face-to-face meeting"} scheduled and invitation email sent.`;
        toast.success(msg);
        setTitle("");
        setDescription("");
        setLocation("");
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
          Choose meeting type (Video Call, Phone Call, or Face-to-Face). An invitation email will be sent automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Meeting Title *</label>
              <Input
                placeholder="e.g., Q3 Strategy Review, Introduction Call"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Meeting Type *</label>
              <Select value={meetingType} onValueChange={(val: "video" | "phone" | "in_person") => setMeetingType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">
                    <span className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-blue-500" />
                      Video Meeting (Zoom)
                    </span>
                  </SelectItem>
                  <SelectItem value="phone">
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-emerald-500" />
                      Phone Call
                    </span>
                  </SelectItem>
                  <SelectItem value="in_person">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      Face-to-Face Meeting
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditional location / phone number input */}
          {meetingType !== "video" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {meetingType === "phone" ? "Phone Number / Contact Details" : "Meeting Location / Venue"}
              </label>
              <Input
                placeholder={meetingType === "phone" ? "e.g., +44 20 7946 0912 or Host will call invitee" : "e.g., HQ Office Room 3B, 100 Main St, London"}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          )}

          {/* Zoom meeting preview */}
          {meetingType === "video" && title.trim() && (
            <div className="flex items-start gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-lg text-xs text-blue-700 dark:text-blue-300">
              <Video className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">A Zoom meeting will be auto-created and the join link emailed to {inviteeName}.</p>
              </div>
            </div>
          )}

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
            <label className="text-xs font-semibold text-muted-foreground">Meeting Agenda / Notes</label>
            <Textarea
              placeholder="Provide meeting context or agenda items..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full mt-2 gap-1.5" disabled={loading}>
            {meetingType === "video" && <Video className="h-4 w-4" />}
            {meetingType === "phone" && <Phone className="h-4 w-4" />}
            {meetingType === "in_person" && <Users className="h-4 w-4" />}
            {loading 
              ? "Scheduling..." 
              : meetingType === "video" 
                ? "Schedule Video Meeting & Create Room"
                : meetingType === "phone"
                  ? "Schedule Phone Call & Send Invite"
                  : "Schedule Face-to-Face Meeting & Send Invite"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
