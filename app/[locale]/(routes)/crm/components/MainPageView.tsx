import React from "react";

import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getLeads } from "@/actions/crm/get-leads";
import { getContractsWithIncludes } from "@/actions/crm/get-contracts";
import { getPostcodeOptions } from "@/actions/crm/get-postcode-options";

import { getRegularLeadsForKevinViewers } from "@/actions/crm/leads/get-kevin-leads";
import { isTeamSupervisor } from "@/actions/crm/leads/get-team-leads";

import LeadsView from "./LeadsView";
import { KevinLeadsGateway } from "./KevinLeadsGateway";
import { LeadsGateway } from "./LeadsGateway";
import ContractsView from "./ContractsView";

const MainPageView = async () => {
  const [crmData, allLeads, contracts, postcodeOptions, regularLeads] = await Promise.all([
    getAllCrmData(),
    getLeads(),
    getContractsWithIncludes(),
    getPostcodeOptions(),
    getRegularLeadsForKevinViewers(),
  ]);

  // admin / CEO / COO: chooser (Leads, Kevin Leads, Pledges) plus the leads table without the Kevin list.
  // Regional / Area Directors: chooser (My Leads, Team Leads, Pledges) plus their leads table.
  // Pledge leads stay in the table (filterable by Category) as well as on their own page.
  const isKevinViewer = regularLeads !== null;
  const isSupervisor = !isKevinViewer && (await isTeamSupervisor());
  const leads = isKevinViewer ? regularLeads : allLeads;

  return (
    <div className="space-y-6">
      {isKevinViewer && <KevinLeadsGateway />}
      {isSupervisor && <LeadsGateway />}
      <LeadsView crmData={crmData} data={leads} postcodeOptions={postcodeOptions} />
      <ContractsView crmData={crmData} data={contracts} />
    </div>
  );
};

export default MainPageView;
