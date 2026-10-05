"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, TrendingUp } from "lucide-react";
import AccountsView from "../components/AccountsView";
import ContactsView from "../components/ContactsView";
import OpportunitiesView from "../components/OpportunitiesView";

interface AccountsOpportunitiesClientProps {
  crmData: any;
  accounts: any[];
  contacts: any[];
  opportunities: any[];
}

export default function AccountsOpportunitiesClient({
  crmData,
  accounts,
  contacts,
  opportunities,
}: AccountsOpportunitiesClientProps) {
  const [activeTab, setActiveTab] = useState("accounts");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 max-w-md bg-muted/70 p-1 rounded-xl">
          <TabsTrigger value="accounts" className="flex items-center gap-2 text-xs font-semibold">
            <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Accounts ({accounts.length})</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2 text-xs font-semibold">
            <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Contacts ({contacts.length})</span>
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="flex items-center gap-2 text-xs font-semibold">
            <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span>Opportunities ({opportunities.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-6 space-y-4">
          <AccountsView crmData={crmData} data={accounts} />
        </TabsContent>

        <TabsContent value="contacts" className="mt-6 space-y-4">
          <ContactsView crmData={crmData} data={contacts} />
        </TabsContent>

        <TabsContent value="opportunities" className="mt-6 space-y-4">
          <OpportunitiesView crmData={crmData} data={opportunities} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
