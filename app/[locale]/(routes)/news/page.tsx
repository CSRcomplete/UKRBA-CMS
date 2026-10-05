import React, { Suspense } from "react";
import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import Container from "../components/ui/Container";
import { NewsClient } from "./NewsClient";

export default async function NewsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  return (
    <Container title="News & Announcements" description="Official UKRBA Internal Company Noticeboard">
      <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading noticeboard...</div>}>
        <NewsClient />
      </Suspense>
    </Container>
  );
}
