import React from "react";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { getMeetings, getTargetsForMeetingBooking } from "@/actions/crm/meetings";
import { MeetingSchedulerForm } from "./components/MeetingSchedulerForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import moment from "moment";
import { Video, Calendar, Clock, AlignLeft, UserPlus, Info } from "lucide-react";

export default async function MeetingsPage() {
  const [meetings, targets] = await Promise.all([
    getMeetings(),
    getTargetsForMeetingBooking(),
  ]);

  return (
    <Container
      title="Meeting Management"
      description="Schedule and track Zoho Meetings aligned with our organizational hierarchy."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheduler Form (Left Column) */}
        <div className="lg:col-span-1">
          <MeetingSchedulerForm eligibleTargets={targets} />
        </div>

        {/* Scheduled Meetings List (Right Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-sm border-muted">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Your Scheduled Meetings</CardTitle>
                <CardDescription>
                  Meetings you scheduled or have been invited to participate in.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {meetings.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2">
                  <Info className="h-8 w-8 text-muted-foreground/50" />
                  <span>No upcoming meetings found. Use the scheduler to book one.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {meetings.map((meeting) => {
                    const isUpcoming = moment(meeting.date).isAfter(moment());
                    const meetingLink = (meeting.metadata as any)?.meetingLink;

                    return (
                      <div
                        key={meeting.id}
                        className={`p-4 rounded-lg border bg-card transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 border-muted hover:border-primary/20`}
                      >
                        <div className="space-y-2 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm text-foreground">{meeting.title}</span>
                            <Badge variant={isUpcoming ? "default" : "secondary"}>
                              {isUpcoming ? "Upcoming" : "Past"}
                            </Badge>
                          </div>

                          {meeting.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {meeting.description}
                            </p>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 text-primary" />
                              <span>{moment(meeting.date).format("MMM DD, YYYY at hh:mm A")}</span>
                            </div>
                            {meeting.duration && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                <span>Duration: {meeting.duration} mins</span>
                              </div>
                            )}
                          </div>

                          {/* Invitees and Host info */}
                          <div className="flex items-center gap-3 pt-1 border-t border-muted/50 text-[10px] text-muted-foreground">
                            <span>Host: {meeting.created_by_user?.name || "System"}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <UserPlus className="h-3 w-3" />
                              <span>
                                Invitees:{" "}
                                {meeting.invitees
                                  ?.map((i: any) => `${i.name} (${i.type})`)
                                  .join(", ") || "None"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {meetingLink && (
                          <div className="flex-shrink-0 flex items-center">
                            <a href={meetingLink} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white">
                                <Video className="h-4 w-4" /> Join Meeting
                              </Button>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Container>
  );
}
