import { Suspense } from "react";
import { notFound } from "next/navigation";

import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";

import Container from "../../../../components/ui/Container";
import LeadsView from "../../../components/LeadsView";

import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getTeamMemberLeads } from "@/actions/crm/leads/get-team-leads";
import { getPostcodeOptions } from "@/actions/crm/get-postcode-options";
import { prismadb } from "@/lib/prisma";

interface Props {
  params: Promise<{ userId: string }>;
}

const TeamMemberLeadsPage = async ({ params }: Props) => {
  const { userId } = await params;

  const leads = await getTeamMemberLeads(userId);
  if (leads === null) notFound();

  const [crmData, postcodeOptions, targetUser] = await Promise.all([
    getAllCrmData(),
    getPostcodeOptions(),
    prismadb.users.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
  ]);

  const displayName = targetUser?.name || targetUser?.email || "Team Member";

  return (
    <Container title={`${displayName}'s Leads`} description={`Leads assigned to ${displayName} and anyone reporting to them.`}>
      <Suspense fallback={<CrmTableSkeleton />}>
        <LeadsView
          crmData={crmData}
          data={leads}
          postcodeOptions={postcodeOptions}
          title={`${displayName}'s Leads`}
          backHref="/crm/leads/team"
        />
      </Suspense>
    </Container>
  );
};

export default TeamMemberLeadsPage;
