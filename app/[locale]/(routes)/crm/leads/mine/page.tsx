import { Suspense } from "react";

import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";

import Container from "../../../components/ui/Container";
import LeadsView from "../../components/LeadsView";

import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getMyLeads } from "@/actions/crm/leads/get-team-leads";
import { getPostcodeOptions } from "@/actions/crm/get-postcode-options";

const MyLeadsPage = async () => {
  const [crmData, leads, postcodeOptions] = await Promise.all([
    getAllCrmData(),
    getMyLeads(),
    getPostcodeOptions(),
  ]);

  return (
    <Container title="My Leads" description="Leads directly assigned to you.">
      <Suspense fallback={<CrmTableSkeleton />}>
        <LeadsView
          crmData={crmData}
          data={leads}
          postcodeOptions={postcodeOptions}
          title="My Leads"
          backHref="/crm/leads"
        />
      </Suspense>
    </Container>
  );
};

export default MyLeadsPage;
