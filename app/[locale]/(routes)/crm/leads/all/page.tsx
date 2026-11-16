import { Suspense } from "react";
import { redirect } from "next/navigation";

import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";

import Container from "../../../components/ui/Container";
import LeadsView from "../../components/LeadsView";

import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getRegularLeadsForKevinViewers } from "@/actions/crm/leads/get-kevin-leads";
import { getPostcodeOptions } from "@/actions/crm/get-postcode-options";

/** Regular leads (without the Kevin list) for admin / CEO / COO. */
const AllLeadsPage = async () => {
  const leads = await getRegularLeadsForKevinViewers();
  if (leads === null) redirect("/crm/leads");

  const [crmData, postcodeOptions] = await Promise.all([
    getAllCrmData(),
    getPostcodeOptions(),
  ]);

  return (
    <Container title="Leads" description="All regular CRM leads.">
      <Suspense fallback={<CrmTableSkeleton />}>
        <LeadsView
          crmData={crmData}
          data={leads}
          postcodeOptions={postcodeOptions}
          title="Leads"
          backHref="/crm/leads"
        />
      </Suspense>
    </Container>
  );
};

export default AllLeadsPage;
