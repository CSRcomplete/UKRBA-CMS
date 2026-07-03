import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";
import RepositoryClient from "./RepositoryClient";

const RepositoryPage = async () => {
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  // 1. Fetch detailed user profile for role verification
  const currentUser = await prismadb.users.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!currentUser) {
    redirect("/auth/signin");
  }

  // 2. Fetch documents for repository where user is uploader OR assignee
  // and visibility maps to one of the levels
  const documents = await prismadb.documents.findMany({
    where: {
      parent_document_id: null,
      deletedAt: null,
      visibility: {
        in: ["regional_director", "area_director", "channel_partner"],
      },
      OR: [
        { createdBy: userId },
        { assigned_user: userId },
      ],
    },
    include: {
      created_by: {
        select: { id: true, name: true, email: true },
      },
      assigned_to_user: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 3. Fetch all active users for assign dropdown
  const allUsers = await prismadb.users.findMany({
    where: {
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
    <RepositoryClient
      documents={documents}
      users={allUsers}
      currentUserId={userId}
      currentUserRole={currentUser.role}
    />
  );
};

export default RepositoryPage;
