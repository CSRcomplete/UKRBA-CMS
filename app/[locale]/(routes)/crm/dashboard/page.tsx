import React from "react";
import Link from "next/link";
import { getAssessments } from "@/actions/crm/get-assessments";
import { AssessmentsTable } from "../components/AssessmentsTable";
import Container from "../../components/ui/Container";
import { getSaleStages } from "@/actions/crm/get-sales-stage";
import CRMKanban from "./_components/CRMKanban";
import { getOpportunities } from "@/actions/crm/get-opportunities";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { serializeDecimalsList } from "@/lib/serialize-decimals";

const CrmDashboardPage = async () => {
  const salesStages = await getSaleStages();
  const opportunities = serializeDecimalsList(await getOpportunities());
  const crmData = await getAllCrmData();
  const recentAssessments = (await getAssessments()).slice(0, 5);

  return (
    <Container
      title="CRM Dashboard"
      description="In development. After this compoment is finished, there will be a optimistic update of the data."
    >
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Assessments</h2>
          <Link href="/crm/assessments" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </div>
        <AssessmentsTable rows={recentAssessments} />
      </div>
      <div className="w-full h-full  overflow-hidden">
        <CRMKanban
          salesStages={salesStages}
          opportunities={opportunities}
          crmData={crmData}
        />
      </div>

      {/*     <CRMKanbanServer
        salesStages={salesStages}
        opportunities={opportunities}
      /> */}
    </Container>
  );
};

export default CrmDashboardPage;
