import { Suspense } from "react";

import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";

import Container from "../../components/ui/Container";
import LeadsView from "../components/LeadsView";

import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getLeads } from "@/actions/crm/get-leads";
import { getPostcodeOptions } from "@/actions/crm/get-postcode-options";
import { getTranslations } from "next-intl/server";

const LeadsPage = async () => {
  const t = await getTranslations("CrmPage");
  const [crmData, leads, postcodeOptions] = await Promise.all([
    getAllCrmData(),
    getLeads(),
    getPostcodeOptions(),
  ]);

  return (
    <Container
      title={t("leads.pageTitle")}
      description={t("leads.pageDescription")}
    >
      <Suspense fallback={<CrmTableSkeleton />}>
        <LeadsView crmData={crmData} data={leads} postcodeOptions={postcodeOptions} />
      </Suspense>
    </Container>
  );
};

export default LeadsPage;
