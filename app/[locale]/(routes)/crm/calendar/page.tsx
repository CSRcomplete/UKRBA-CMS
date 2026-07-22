import React, { Suspense } from "react";
import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Container from "../../components/ui/Container";
import { CalendarClient } from "./CalendarClient";

export default async function CalendarPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <Container title="Business Calendar & Diary" description="Staff Calendar, Meetings & Task Scheduling">
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading calendar...</div>}>
        <CalendarClient />
      </Suspense>
    </Container>
  );
}
