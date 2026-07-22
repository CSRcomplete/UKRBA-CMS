import React from "react";
import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";
import Container from "../components/ui/Container";
import { RecruitmentClient } from "./RecruitmentClient";

export default async function RecruitmentPage() {
  const session = await getSession();

  if (!session) redirect("/sign-in");

  const userId = session.user?.id as string;

  const dbUser = await prismadb.users.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const role = dbUser?.role?.toLowerCase() || "";

  // Recruitment centre is strictly admin/CEO only
  if (!["admin", "ceo"].includes(role)) {
    redirect("/");
  }

  return (
    <Container
      title="Recruitment Centre"
      description="One-stop recruitment pipeline — from CV receipt to signed contract. CEO & Admin access only."
    >
      <RecruitmentClient />
    </Container>
  );
}
