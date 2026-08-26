import { Suspense } from "react";

import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";

import Container from "../../../../components/ui/Container";
import LeadsView from "../../../components/LeadsView";

import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getLeads } from "@/actions/crm/get-leads";
import { getPostcodeOptions } from "@/actions/crm/get-postcode-options";

const AllTeamLeadsPage = async () => {
  const [crmData, leads, postcodeOptions] = await Promise.all([
    getAllCrmData(),
    getLeads(),
    getPostcodeOptions(),
  ]);

  return (
    <Container title="All Team Leads" description="Every lead across your whole team, combined.">
      <Suspense fallback={<CrmTableSkeleton />}>
        <LeadsView
          crmData={crmData}
          data={leads}
          postcodeOptions={postcodeOptions}
          title="All Team Leads"
          backHref="/crm/leads/team"
        />
      </Suspense>
    </Container>
  );
};

export default AllTeamLeadsPage;
