import React from "react";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth-server";
import { prismadb } from "@/lib/prisma";
import Container from "../../../components/ui/Container";
import UserManageForm from "./components/UserManageForm";

interface UserPageProps {
  params: Promise<{
    userId: string;
    locale: string;
  }>;
}

export default async function UserPage(props: UserPageProps) {
  const params = await props.params;
  const session = await getSession();

  if (session?.user?.role !== "admin" && session?.user?.role !== "ceo" && session?.user?.role !== "operations_director") {
    redirect("/admin/users");
  }

  // Fetch the target user details, their postcode routing assignments, and children
  const user = await prismadb.users.findUnique({
    where: {
      id: params.userId,
    },
    include: {
      postcode_routing_assignments: {
        select: {
          postcode_routing_id: true,
        },
      },
      children: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  // Fetch all postcode areas
  const postcodes = await prismadb.nextcrm_postcode_routing.findMany({
    orderBy: {
      postcode_area: "asc",
    },
  });

  // Fetch all active users for manager selection
  const allUsers = await prismadb.users.findMany({
    where: {
      userStatus: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  // Fetch active channel partners
  const channelPartners = await prismadb.users.findMany({
    where: {
      role: "channel_partner",
      userStatus: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <Container title="Manage Staff Member" description="Configure roles, assignments and reporting lines.">
      <UserManageForm
        user={user}
        postcodes={postcodes}
        allUsers={allUsers}
        channelPartners={channelPartners}
      />
    </Container>
  );
}
