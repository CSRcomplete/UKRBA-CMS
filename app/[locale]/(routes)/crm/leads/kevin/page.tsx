import { Suspense } from "react";
import { redirect } from "next/navigation";

import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";

import Container from "../../../components/ui/Container";
import LeadsView from "../../components/LeadsView";

import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getKevinLeads } from "@/actions/crm/leads/get-kevin-leads";
import { getPostcodeOptions } from "@/actions/crm/get-postcode-options";

const KevinLeadsPage = async () => {
  const leads = await getKevinLeads();
  if (leads === null) redirect("/crm/leads");

  const [crmData, postcodeOptions] = await Promise.all([
    getAllCrmData(),
    getPostcodeOptions(),
  ]);

  return (
    <Container title="Kevin Leads" description="Prospect list supplied by Kevin.">
      <Suspense fallback={<CrmTableSkeleton />}>
        <LeadsView
          crmData={crmData}
          data={leads}
          postcodeOptions={postcodeOptions}
          title="Kevin Leads"
          backHref="/crm/leads/kevin"
        />
      </Suspense>
    </Container>
  );
};

export default KevinLeadsPage;
