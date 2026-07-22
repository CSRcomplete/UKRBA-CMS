"use client";

import React, { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import moment from "moment";
import {
  Video,
  Calendar,
  Clock,
  UserPlus,
  Info,
  Zap,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import { JitsiMeetRoom } from "./components/JitsiMeetRoom";
import { MeetingSchedulerForm } from "./components/MeetingSchedulerForm";
import { createInstantMeeting } from "@/actions/crm/meetings";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Meeting {
  id: string;
  title: string;
  description?: string | null;
  date: Date;
  duration?: number | null;
  jitsiRoomId?: string;
  jitsiUrl?: string | null;
  created_by_user?: { name?: string | null; email?: string | null } | null;
  invitees?: { type: string; name: string }[];
}

interface MeetingsClientProps {
  meetings: Meeting[];
  userDisplayName: string;
  userEmail?: string;
  eligibleTargets: { users: any[]; leads: any[] };
}

export function MeetingsClient({ meetings, userDisplayName, userEmail, eligibleTargets }: MeetingsClientProps) {
  const router = useRouter();
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<"main" | "schedule">("main");

  const upcomingMeetings = meetings.filter((m) => moment(m.date).isAfter(moment()));
  const pastMeetings = meetings.filter((m) => moment(m.date).isBefore(moment()));

  const handleInstantMeeting = () => {
    startTransition(async () => {
      const result = await createInstantMeeting();
      if (result.error) {
        toast.error(result.error);
      } else if (result.jitsiRoomId) {
        toast.success("Instant meeting room created!");
        setActiveRoomId(result.jitsiRoomId);
      }
    });
  };

  const handleLeaveRoom = () => {
    setActiveRoomId(null);
    router.refresh();
  };

  // Jitsi embedded room view
  if (activeRoomId) {
    return (
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1" onClick={handleLeaveRoom}>
            <ArrowLeft className="h-4 w-4" /> Back to Meetings
          </Button>
          <div className="text-sm text-muted-foreground">
            Room: <code className="text-xs bg-muted px-1 py-0.5 rounded">{activeRoomId}</code>
          </div>
        </div>
        <JitsiMeetRoom
          roomId={activeRoomId}
          displayName={userDisplayName}
          userEmail={userEmail}
          onLeave={handleLeaveRoom}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Video className="h-6 w-6 text-primary" />
            Video Meetings
          </h1>
          <p className="text-sm text-muted-foreground">
            Powered by <strong>Jitsi Meet</strong> — browser-based video calls, no software needed.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={view === "schedule" ? "default" : "outline"}
            size="sm"
            className="gap-1.5"
            onClick={() => setView(view === "schedule" ? "main" : "schedule")}
          >
            <Calendar className="h-4 w-4" />
            {view === "schedule" ? "← Back" : "Schedule Meeting"}
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleInstantMeeting}
            disabled={isPending}
          >
            <Zap className="h-4 w-4" />
            {isPending ? "Creating..." : "Start Instant Meeting"}
          </Button>
        </div>
      </div>

      {view === "schedule" ? (
        /* ── Schedule view ──────────────────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MeetingSchedulerForm
            eligibleTargets={eligibleTargets}
            onScheduled={(roomId) => {
              setView("main");
              router.refresh();
            }}
          />
          <div className="rounded-xl border p-5 bg-muted/30 space-y-3 text-sm">
            <h3 className="font-semibold text-base flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> How It Works</h3>
            <ul className="space-y-2 text-muted-foreground text-xs list-disc pl-4">
              <li>Fill in the meeting details and select your invitee.</li>
              <li>A unique <strong>Jitsi Meet</strong> room is automatically created — no external account needed.</li>
              <li>Your invitee receives an email with the meeting link.</li>
              <li>On the meeting time, click <strong>"Join Now"</strong> to open the call directly in this CRM.</li>
              <li>Works on all modern browsers — no app download required.</li>
            </ul>
          </div>
        </div>
      ) : (
        /* ── Main view ──────────────────────────────────────────────────── */
        <div className="space-y-6">
          {/* Upcoming Meetings */}
          <div className="space-y-3">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Upcoming Meetings ({upcomingMeetings.length})
            </h2>

            {upcomingMeetings.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed rounded-xl text-muted-foreground text-sm flex flex-col items-center gap-2">
                <Calendar className="h-8 w-8 opacity-40" />
                <span>No upcoming meetings. Schedule one or start an instant call.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    isUpcoming
                    onJoin={(roomId) => setActiveRoomId(roomId)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Past Meetings */}
          {pastMeetings.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-muted-foreground flex items-center gap-2">
                <ChevronRight className="h-4 w-4" />
                Past Meetings ({pastMeetings.length})
              </h2>
              <div className="space-y-2 opacity-70">
                {pastMeetings.slice(0, 5).map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    isUpcoming={false}
                    onJoin={(roomId) => setActiveRoomId(roomId)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Meeting Card ─────────────────────────────────────────────────────────────

function MeetingCard({
  meeting,
  isUpcoming,
  onJoin,
}: {
  meeting: Meeting;
  isUpcoming: boolean;
  onJoin: (roomId: string) => void;
}) {
  const countdown = isUpcoming
    ? moment(meeting.date).fromNow()
    : moment(meeting.date).fromNow();

  return (
    <div className={`p-4 rounded-xl border bg-card transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 hover:shadow-sm ${isUpcoming ? "border-primary/20 bg-primary/5" : "border-muted"}`}>
      <div className="space-y-2 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{meeting.title}</span>
          <Badge variant={isUpcoming ? "default" : "secondary"} className="text-[11px]">
            {isUpcoming ? `⏰ ${countdown}` : "Past"}
          </Badge>
          {(meeting as any).metadata?.instant && (
            <Badge className="bg-emerald-600 text-white text-[11px]">Instant</Badge>
          )}
        </div>

        {meeting.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">{meeting.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            {moment(meeting.date).format("ddd DD MMM YYYY [at] HH:mm")}
          </span>
          {meeting.duration && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {meeting.duration} mins
            </span>
          )}
          <span className="flex items-center gap-1">
            Host: <strong className="text-foreground ml-1">{meeting.created_by_user?.name || "System"}</strong>
          </span>
          {meeting.invitees && meeting.invitees.length > 0 && (
            <span className="flex items-center gap-1">
              <UserPlus className="h-3.5 w-3.5" />
              {meeting.invitees.map((i) => `${i.name} (${i.type})`).join(", ")}
            </span>
          )}
        </div>
      </div>

      {meeting.jitsiRoomId && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Embedded join */}
          <Button
            size="sm"
            className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => onJoin(meeting.jitsiRoomId!)}
          >
            <Video className="h-4 w-4" />
            Join Now
          </Button>
          {/* External fallback */}
          {meeting.jitsiUrl && (
            <a href={meeting.jitsiUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
