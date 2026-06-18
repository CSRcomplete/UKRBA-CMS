import React from "react";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { getMember } from "@/actions/crm/members";
import { MemberDetailForm } from "./components/MemberDetailForm";
import { EntityTasks } from "@/components/crm/tasks/EntityTasks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { DirectMeetingScheduler } from "@/components/crm/meetings/DirectMeetingScheduler";

interface MemberDetailPageProps {
  params: Promise<{
    memberId: string;
  }>;
}

export default async function MemberDetailPage(props: MemberDetailPageProps) {
  const params = await props.params;
  const { memberId } = params;
  const member = await getMember(memberId);

  if (!member) {
    return (
      <Container title="Member Not Found" description="The requested member record does not exist.">
        <div className="py-6">
          <Link href="/crm/members">
            <Button variant="outline" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" /> Back to Members
            </Button>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container
      title={`Member: ${member.contact_name}`}
      description="View details, lifecycle trail, and next actions."
    >
      <div className="pb-4">
        <Link href="/crm/members">
          <Button variant="ghost" className="flex items-center gap-1 -ml-3 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" /> Back to Members
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Next Actions</TabsTrigger>
          <TabsTrigger value="meetings">Schedule Meeting</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <MemberDetailForm member={member} />
        </TabsContent>
        <TabsContent value="tasks">
          <EntityTasks entityId={memberId} entityType="member" />
        </TabsContent>
        <TabsContent value="meetings">
          <div className="max-w-2xl">
            <DirectMeetingScheduler
              inviteeType="lead"
              inviteeId={member.lead_id}
              inviteeName={member.contact_name}
            />
          </div>
        </TabsContent>
      </Tabs>
    </Container>
  );
}
