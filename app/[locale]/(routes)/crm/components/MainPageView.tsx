import React from "react";

import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getLeads } from "@/actions/crm/get-leads";
import { getContractsWithIncludes } from "@/actions/crm/get-contracts";
import { getPostcodeOptions } from "@/actions/crm/get-postcode-options";

import { getRegularLeadsForKevinViewers } from "@/actions/crm/leads/get-kevin-leads";

import LeadsView from "./LeadsView";
import { KevinLeadsGateway } from "./KevinLeadsGateway";
import ContractsView from "./ContractsView";

const MainPageView = async () => {
  const [crmData, allLeads, contracts, postcodeOptions, regularLeads] = await Promise.all([
    getAllCrmData(),
    getLeads(),
    getContractsWithIncludes(),
    getPostcodeOptions(),
    getRegularLeadsForKevinViewers(),
  ]);

  // admin / CEO / COO: chooser (Leads or Kevin Leads) plus the leads table without the Kevin list.
  const isKevinViewer = regularLeads !== null;
  const leads = isKevinViewer ? regularLeads : allLeads;

  return (
    <div className="space-y-6">
      {isKevinViewer && <KevinLeadsGateway />}
      <LeadsView crmData={crmData} data={leads} postcodeOptions={postcodeOptions} />
      <ContractsView crmData={crmData} data={contracts} />
    </div>
  );
};

export default MainPageView;
