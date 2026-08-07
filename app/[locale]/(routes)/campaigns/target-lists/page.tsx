import { Suspense } from "react";

import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";
import Container from "../../components/ui/Container";
import TargetListsView from "./components/TargetListsView";
import { getTargetLists } from "@/actions/crm/get-target-lists";
import { getPostcodeOptions } from "@/actions/crm/get-postcode-options";
import { getLeadsForAudience } from "@/actions/crm/leads/get-leads-for-audience";

const TargetListsPage = async () => {
  const [targetLists, postcodeOptions, leads] = await Promise.all([
    getTargetLists(),
    getPostcodeOptions(),
    getLeadsForAudience(),
  ]);
  return (
    <Container
      title="Target Lists"
      description="Manage your target lists for campaigns and outreach"
    >
      <Suspense fallback={<CrmTableSkeleton />}>
        <TargetListsView data={targetLists} postcodeOptions={postcodeOptions} leads={leads} />
      </Suspense>
    </Container>
  );
};

export default TargetListsPage;
