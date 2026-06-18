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
import { Calendar, User, Video, Clock, AlignLeft, ShieldAlert } from "lucide-react";

interface MeetingSchedulerFormProps {
  eligibleTargets: {
    users: any[];
    leads: any[];
  };
}

export function MeetingSchedulerForm({ eligibleTargets }: MeetingSchedulerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(moment().add(1, "days").format("YYYY-MM-DDTHH:mm"));
  const [duration, setDuration] = useState("30");
  const [meetingLink, setMeetingLink] = useState("");
  const [inviteeType, setInviteeType] = useState<"user" | "lead">("lead");
  const [inviteeId, setInviteeId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Meeting title is required");
      return;
    }
    if (!inviteeId) {
      toast.error("Please select an invitee");
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
        setInviteeId("");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  };

  const currentOptions = inviteeType === "user" ? eligibleTargets.users : eligibleTargets.leads;

  return (
    <Card className="shadow-sm border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Schedule New Meeting
        </CardTitle>
        <CardDescription>
          Create a meeting with staff subordinates or leads you manage.
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
              <label className="text-xs font-semibold text-muted-foreground">Invitee Type *</label>
              <Select
                value={inviteeType}
                onValueChange={(v: "user" | "lead") => {
                  setInviteeType(v);
                  setInviteeId(""); // reset selected value
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">CRM Lead / Member</SelectItem>
                  <SelectItem value="user">Staff Member (Subordinate)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Select Invitee *</label>
              <Select value={inviteeId} onValueChange={setInviteeId} disabled={currentOptions.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={currentOptions.length === 0 ? "No eligible options" : "Select person..."} />
                </SelectTrigger>
                <SelectContent>
                  {currentOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.name} {opt.company ? `(${opt.company})` : ""} {opt.role ? `[${opt.role.replace(/_/g, " ")}]` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {inviteeType === "user" && currentOptions.length === 0 && (
            <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded text-amber-800 dark:text-amber-300 text-xs">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span>You cannot book meetings with superior or equal staff members. No subordinates found.</span>
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

          <Button type="submit" className="w-full mt-2" disabled={loading || (inviteeType === "user" && currentOptions.length === 0)}>
            {loading ? "Scheduling..." : "Schedule Meeting"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
