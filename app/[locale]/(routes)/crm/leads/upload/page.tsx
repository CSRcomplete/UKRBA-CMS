import { getSession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";
import Container from "../../../components/ui/Container";
import UploadLeadsClient from "./UploadLeadsClient";

const UploadLeadsPage = async () => {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const currentUser = await prismadb.users.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true },
  });

  if (!currentUser) {
    redirect("/auth/signin");
  }

  return (
    <Container
      title="Upload Leads"
      description="Upload new business leads individually or in bulk via CSV for Regional and Area Managers"
    >
      <UploadLeadsClient currentUser={currentUser} />
    </Container>
  );
};

export default UploadLeadsPage;
