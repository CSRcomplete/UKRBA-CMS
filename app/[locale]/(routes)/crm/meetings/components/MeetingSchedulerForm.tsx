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
import { generateJitsiRoomId, getJitsiMeetUrl } from "@/lib/jitsi";
import moment from "moment";
import { Calendar, User, Video, Clock, AlignLeft, ShieldAlert, Link2 } from "lucide-react";

interface MeetingSchedulerFormProps {
  eligibleTargets: {
    users: any[];
    leads: any[];
  };
  onScheduled?: (jitsiRoomId: string) => void;
}

export function MeetingSchedulerForm({ eligibleTargets, onScheduled }: MeetingSchedulerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(moment().add(1, "days").format("YYYY-MM-DDTHH:mm"));
  const [duration, setDuration] = useState("30");
  const [inviteeType, setInviteeType] = useState<"user" | "lead">("lead");
  const [inviteeId, setInviteeId] = useState("");

  // Live preview of Jitsi room URL
  const previewRoomId = title.trim() ? generateJitsiRoomId(title.replace(/\s+/g, "-").slice(0, 30) + "-preview") : null;
  const previewJitsiUrl = previewRoomId ? getJitsiMeetUrl(previewRoomId) : null;

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
        inviteeType,
        inviteeId,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Meeting scheduled! Jitsi room created automatically.");
        setTitle("");
        setDescription("");
        setInviteeId("");
        if (onScheduled && result.jitsiRoomId) {
          onScheduled(result.jitsiRoomId);
        } else {
          router.refresh();
        }
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
          A Jitsi Meet video room will be automatically created and shared with your invitee.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Meeting Title *</label>
            <Input
              placeholder="e.g. Q3 Strategy Review, Introduction Call"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Jitsi URL Preview */}
          {title.trim() && (
            <div className="flex items-start gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-lg text-xs text-blue-700 dark:text-blue-300">
              <Video className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">Jitsi Room will be auto-created:</p>
                <p className="font-mono opacity-80 truncate">meet.jit.si/ukrba-{title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30)}-XXXXXX</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Invitee Type *</label>
              <Select
                value={inviteeType}
                onValueChange={(v: "user" | "lead") => {
                  setInviteeType(v);
                  setInviteeId("");
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
                      {opt.name || opt.email} {opt.company ? `(${opt.company})` : ""} {opt.role ? `[${opt.role.replace(/_/g, " ")}]` : ""}
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
                  <SelectItem value="120">2 hours</SelectItem>
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

          <Button
            type="submit"
            className="w-full mt-2 gap-1.5"
            disabled={loading || (inviteeType === "user" && currentOptions.length === 0)}
          >
            <Video className="h-4 w-4" />
            {loading ? "Scheduling..." : "Schedule Meeting & Create Room"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
