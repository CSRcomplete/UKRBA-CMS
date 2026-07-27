import React from "react";

import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getLeads } from "@/actions/crm/get-leads";
import { getContractsWithIncludes } from "@/actions/crm/get-contracts";

import LeadsView from "./LeadsView";
import ContractsView from "./ContractsView";

const MainPageView = async () => {
  const [crmData, leads, contracts] = await Promise.all([
    getAllCrmData(),
    getLeads(),
    getContractsWithIncludes(),
  ]);

  return (
    <div className="space-y-6">
      <LeadsView crmData={crmData} data={leads} />
      <ContractsView crmData={crmData} data={contracts} />
    </div>
  );
};

export default MainPageView;
