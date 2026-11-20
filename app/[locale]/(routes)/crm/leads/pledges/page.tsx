import { Suspense } from "react";

import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";

import Container from "../../../components/ui/Container";
import LeadsView from "../../components/LeadsView";

import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getPledgeLeads } from "@/actions/crm/leads/get-pledge-leads";
import { getPostcodeOptions } from "@/actions/crm/get-postcode-options";

/** Businesses that have taken the pledge, kept apart from the regular leads list. */
const PledgeLeadsPage = async () => {
  const [crmData, leads, postcodeOptions] = await Promise.all([
    getAllCrmData(),
    getPledgeLeads(),
    getPostcodeOptions(),
  ]);

  return (
    <Container title="Pledges" description="Businesses that have taken the pledge.">
      <Suspense fallback={<CrmTableSkeleton />}>
        <LeadsView
          crmData={crmData}
          data={leads}
          postcodeOptions={postcodeOptions}
          title="Pledges"
          backHref="/crm/leads/pledges"
        />
      </Suspense>
    </Container>
  );
};

export default PledgeLeadsPage;
