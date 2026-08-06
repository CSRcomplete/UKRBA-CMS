import React, { Suspense } from "react";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { getMeetings, getTargetsForMeetingBooking } from "@/actions/crm/meetings";
import { getSession } from "@/lib/auth-server";
import { MeetingsClient } from "./MeetingsClient";
import { MeetingSchedulerForm } from "./components/MeetingSchedulerForm";

export default async function MeetingsPage() {
  const [meetings, targets, session] = await Promise.all([
    getMeetings(),
    getTargetsForMeetingBooking(),
    getSession(),
  ]);

  const user = session?.user;
  const userDisplayName = user?.name || user?.email || "UKRBA Staff";
  const userEmail = user?.email || undefined;

  return (
    <Container
      title="Video Meetings"
      description="Powered by Zoom — video conferencing integrated directly into UKRBA CMS."
    >
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading meetings...</div>}>
        <MeetingsClient
          meetings={meetings as any}
          userDisplayName={userDisplayName}
          userEmail={userEmail}
          eligibleTargets={targets}
        />
      </Suspense>
    </Container>
  );
}
