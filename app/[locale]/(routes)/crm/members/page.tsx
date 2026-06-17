import React, { Suspense } from "react";
import Container from "../../components/ui/Container";
import { getMembers } from "@/actions/crm/members";
import { prismadb } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import moment from "moment";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";

export default async function MembersPage() {
  const members = await getMembers();

  // Fetch all active tasks to resolve next actions for members in-memory
  const activeTasks = await prismadb.tasks.findMany({
    where: { taskStatus: "ACTIVE" },
    orderBy: { dueDateAt: "asc" },
  });

  // Fetch users to display owner names
  const users = await prismadb.users.findMany({
    select: { id: true, name: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u.name]));

  const membersWithActions = members.map((member: any) => {
    const nextTask = activeTasks.find((task: any) => {
      if (task.tags && typeof task.tags === "object") {
        return (task.tags as any).memberId === member.id;
      }
      return false;
    });

    const ownerName = member.assigned_channel_partner_id
      ? userMap.get(member.assigned_channel_partner_id)
      : member.assigned_area_director_id
      ? userMap.get(member.assigned_area_director_id)
      : member.assigned_regional_director_id
      ? userMap.get(member.assigned_regional_director_id)
      : "Unassigned";

    return {
      ...member,
      ownerName,
      nextAction: nextTask ? {
        title: nextTask.title,
        dueDateAt: nextTask.dueDateAt,
      } : null,
    };
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Membership":
        return <Badge className="bg-green-600 hover:bg-green-700 text-white">Membership</Badge>;
      case "Onboarding":
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white">Onboarding</Badge>;
      case "Renewal":
        return <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white">Renewal</Badge>;
      case "Retention":
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white">Retention</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Container
      title="Member Management"
      description="Track converted members, lifecycle statuses, responsible owners, and actions."
    >
      <Card className="shadow-sm border-muted">
        <CardHeader className="pb-3">
          <CardTitle>All CRM Members</CardTitle>
          <CardDescription>
            Below is the list of converted members permanently tracked in the CRM system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {membersWithActions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No members converted yet. Converted leads automatically appear here.
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member Name</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Lifecycle Status</TableHead>
                    <TableHead>Responsible Owner</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Converted Date</TableHead>
                    <TableHead>Next Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersWithActions.map((member) => (
                    <TableRow key={member.id} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-primary hover:underline">
                        <Link href={`/crm/members/${member.id}`}>{member.contact_name}</Link>
                      </TableCell>
                      <TableCell>{member.business_name}</TableCell>
                      <TableCell>{getStatusBadge(member.lifecycle_status)}</TableCell>
                      <TableCell className="text-sm font-medium">{member.ownerName}</TableCell>
                      <TableCell className="text-xs space-y-1">
                        <div>{member.email}</div>
                        <div className="text-muted-foreground">{member.telephone}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {moment(member.createdAt).format("MMM DD, YYYY")}
                      </TableCell>
                      <TableCell>
                        {member.nextAction ? (
                          <div className="flex flex-col text-xs max-w-[150px]">
                            <span className="font-semibold truncate text-primary hover:underline" title={member.nextAction.title}>
                              {member.nextAction.title}
                            </span>
                            <span className="text-muted-foreground text-[10px]">
                              {moment(member.nextAction.dueDateAt).format("YY-MM-DD")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
