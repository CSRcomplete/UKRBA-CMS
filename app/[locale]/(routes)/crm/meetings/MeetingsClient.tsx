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
  Copy,
  Phone,
  Users,
  MapPin,
  Pencil,
  XCircle,
} from "lucide-react";
import { MeetingSchedulerForm } from "./components/MeetingSchedulerForm";
import { EditMeetingDialog } from "./components/EditMeetingDialog";
import { createInstantMeeting, cancelMeeting } from "@/actions/crm/meetings";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import AlertModal from "@/components/modals/alert-modal";

interface Meeting {
  id: string;
  title: string;
  description?: string | null;
  date: Date;
  duration?: number | null;
  meetingType?: "video" | "phone" | "in_person";
  location?: string | null;
  isHost?: boolean;
  zoomMeetingId?: string;
  zoomJoinUrl?: string | null;
  zoomStartUrl?: string | null;
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
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<"main" | "schedule">("main");

  const upcomingMeetings = meetings.filter((m) => moment(m.date).isAfter(moment()));
  const pastMeetings = meetings.filter((m) => moment(m.date).isBefore(moment()));

  const handleInstantMeeting = () => {
    startTransition(async () => {
      const result = await createInstantMeeting();
      if (result.error) {
        toast.error(result.error);
      } else if (result.zoomJoinUrl) {
        toast.success("Instant Zoom meeting created! Opening now...");
        window.open(result.zoomJoinUrl, "_blank", "noopener,noreferrer");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            CRM Meetings
          </h1>
          <p className="text-sm text-muted-foreground">
            Schedule Video Calls (Zoom), Phone Calls, or Face-to-Face meetings with automatic email notifications.
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
            {isPending ? "Creating..." : "Start Instant Video Call"}
          </Button>
        </div>
      </div>

      {view === "schedule" ? (
        /* ── Schedule view ──────────────────────────────────────────────── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MeetingSchedulerForm
            eligibleTargets={eligibleTargets}
            onScheduled={() => {
              setView("main");
              router.refresh();
            }}
          />
          <div className="rounded-xl border p-5 bg-muted/30 space-y-3 text-sm">
            <h3 className="font-semibold text-base flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> How It Works</h3>
            <ul className="space-y-2 text-muted-foreground text-xs list-disc pl-4">
              <li>Select between <strong>Video Call</strong>, <strong>Phone Call</strong>, or <strong>Face-to-Face Meeting</strong>.</li>
              <li>For Video Calls, a unique <strong>Zoom</strong> meeting is automatically created.</li>
              <li>For Phone Calls & Face-to-Face meetings, enter phone number or location venue details.</li>
              <li>Your invitee will instantly receive a formatted email invitation with meeting details.</li>
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
                  <MeetingCard key={meeting.id} meeting={meeting} isUpcoming />
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
                  <MeetingCard key={meeting.id} meeting={meeting} isUpcoming={false} />
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
}: {
  meeting: Meeting;
  isUpcoming: boolean;
}) {
  const router = useRouter();
  const countdown = isUpcoming
    ? moment(meeting.date).fromNow()
    : moment(meeting.date).fromNow();

  const meetingType = meeting.meetingType || "video";

  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const result = await cancelMeeting(meeting.id);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Meeting cancelled");
        setCancelOpen(false);
        router.refresh();
      }
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className={`p-4 rounded-xl border bg-card transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 hover:shadow-sm ${isUpcoming ? "border-primary/20 bg-primary/5" : "border-muted"}`}>
      <div className="space-y-2 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{meeting.title}</span>
          
          {/* Meeting Type Badge */}
          {meetingType === "video" && (
            <Badge variant="outline" className="text-[11px] gap-1 border-blue-200 text-blue-700 dark:border-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30">
              <Video className="h-3 w-3" /> Video Call
            </Badge>
          )}
          {meetingType === "phone" && (
            <Badge variant="outline" className="text-[11px] gap-1 border-emerald-200 text-emerald-700 dark:border-emerald-900 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
              <Phone className="h-3 w-3" /> Phone Call
            </Badge>
          )}
          {meetingType === "in_person" && (
            <Badge variant="outline" className="text-[11px] gap-1 border-purple-200 text-purple-700 dark:border-purple-900 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/30">
              <Users className="h-3 w-3" /> Face-to-Face
            </Badge>
          )}

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

        {meeting.location && meetingType !== "video" && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span>{meeting.location}</span>
          </p>
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

      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
        {meetingType === "video" && meeting.zoomJoinUrl && (
          <>
            {/* Always use the plain join link, even for the CRM-side "host" —
                Zoom's own start link signs whoever clicks it in as the one
                shared Zoom account (staff don't have individual licenses),
                which showed everyone's name as that account's owner
                regardless of who was actually joining. The meeting already
                allows join_before_host, so nothing requires the real start
                link. */}
            <a href={meeting.zoomJoinUrl} target="_blank" rel="noopener noreferrer">
              <Button
                size="sm"
                className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                <Video className="h-4 w-4" />
                Join Now
              </Button>
            </a>

            {/* Copy meeting link button */}
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-950/40"
              onClick={() => {
                navigator.clipboard.writeText(meeting.zoomJoinUrl!);
                toast.success("Meeting link copied to clipboard!");
              }}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Link
            </Button>

            {/* External fallback */}
            <a href={meeting.zoomJoinUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1 text-xs" title="Open meeting in new tab">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </a>
          </>
        )}

        {/* Host-only management controls */}
        {meeting.isHost && isUpcoming && (
          <>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1 text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950/40"
              onClick={() => setCancelOpen(true)}
            >
              <XCircle className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </>
        )}
      </div>

      {meeting.isHost && (
        <>
          <EditMeetingDialog meeting={meeting} open={editOpen} onOpenChange={setEditOpen} />
          <AlertModal
            isOpen={cancelOpen}
            onClose={() => setCancelOpen(false)}
            onConfirm={handleCancel}
            loading={cancelling}
            title="Cancel this meeting?"
            description="Invitees will be notified by email that this meeting has been cancelled. This cannot be undone."
          />
        </>
      )}
    </div>
  );
}
