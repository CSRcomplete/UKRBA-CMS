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

  const isSuperUser = ["admin", "ceo", "operations_director"].includes(currentUser.role);
  const isRD = currentUser.role === "regional_director";
  const isAD = currentUser.role === "area_director";
  const isCP = currentUser.role === "channel_partner";

  const allowedLevels: string[] = [];
  if (isSuperUser || isRD) {
    allowedLevels.push("regional_director");
  }
  if (isSuperUser || isRD || isAD) {
    allowedLevels.push("area_director");
  }
  if (isSuperUser || isRD || isAD || isCP) {
    allowedLevels.push("channel_partner");
  }

  // 2. Fetch documents for repository where visibility maps to allowed levels
  // and the document is either created by the user, assigned to the user, or not assigned (visible to all at that level).
  const documents = await prismadb.documents.findMany({
    where: {
      parent_document_id: null,
      deletedAt: null,
      visibility: {
        in: allowedLevels,
      },
      OR: [
        { createdBy: userId },
        { assigned_user: userId },
        { assigned_user: null },
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
