import { getUsers } from "@/actions/get-users";
import React from "react";
import Container from "../../components/ui/Container";
import { InviteForm } from "./components/IviteForm";
import { CreateUserForm } from "./components/CreateUserForm";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { getSession } from "@/lib/auth-server";
import { AdminUserDataTable } from "./table-components/data-table";
import { columns } from "./table-components/columns";
import { Users } from "@prisma/client";
import { Button } from "@/components/ui/button";
import SendMailToAll from "./components/send-mail-to-all";
import { getTranslations } from "next-intl/server";

const AdminUsersPage = async () => {
  const users: Users[] = await getUsers();
  const t = await getTranslations("AdminPage");

  const session = await getSession();

  if (session?.user?.role !== "admin" && session?.user?.role !== "ceo") {
    return (
      <Container
        title={t("title")}
        description={t("accessNotAllowed")}
      >
        <div className="flex w-full h-full items-center justify-center">
          {t("accessNotAllowed")}
        </div>
      </Container>
    );
  }

  return (
    <Container
      title={t("users.title")}
      description={t("users.description")}
    >
      <div className="w-full">
        <Tabs defaultValue="invite" className="w-full space-y-4">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="invite">Invite User</TabsTrigger>
            <TabsTrigger value="manual">Add Manually</TabsTrigger>
          </TabsList>
          <TabsContent value="invite" className="space-y-4">
            <div className="flex-col1">
              <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                {t("users.inviteHeading")}
              </h4>
              <InviteForm />
            </div>
          </TabsContent>
          <TabsContent value="manual" className="space-y-4">
            <div>
              <h4 className="scroll-m-20 text-xl font-semibold tracking-tight px-5 pt-2">
                Create User Manually
              </h4>
              <CreateUserForm />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Separator />
      <div>
        <SendMailToAll />
      </div>
      <Separator />

      <AdminUserDataTable columns={columns} data={users} />
    </Container>
  );
};

export default AdminUsersPage;
