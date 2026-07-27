import { Suspense } from "react";
import Container from "../../components/ui/Container";
import CrmTableSkeleton from "@/components/skeletons/crm-table-skeleton";
import { getAllCrmData } from "@/actions/crm/get-crm-data";
import { getAccounts } from "@/actions/crm/get-accounts";
import { getContacts } from "@/actions/crm/get-contacts";
import { getOpportunitiesFull } from "@/actions/crm/get-opportunities-with-includes";
import AccountsOpportunitiesClient from "./AccountsOpportunitiesClient";

const AccountsOpportunitiesPage = async () => {
  const [crmData, accounts, contacts, opportunities] = await Promise.all([
    getAllCrmData(),
    getAccounts(),
    getContacts(),
    getOpportunitiesFull(),
  ]);

  return (
    <Container
      title="Accounts, Contacts & Opportunities"
      description="Dedicated workspace for managing business accounts, customer contacts, and sales opportunities"
    >
      <Suspense fallback={<CrmTableSkeleton />}>
        <AccountsOpportunitiesClient
          crmData={crmData}
          accounts={accounts}
          contacts={contacts}
          opportunities={opportunities}
        />
      </Suspense>
    </Container>
  );
};

export default AccountsOpportunitiesPage;
