import { Suspense } from "react";
import { getSession } from "@/lib/auth-server";
import {
  CoinsIcon,
  Contact,
  DollarSignIcon,
  FilePenLine,
  FileText,
  HeartHandshakeIcon,
  LandmarkIcon,
  Megaphone,
  Target,
  UserIcon,
} from "lucide-react";
import Link from "next/link";

import Container from "./components/ui/Container";
import LoadingBox from "./components/dasboard/loading-box";
import StorageQuota from "./components/dasboard/storage-quota";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import {
  getTasksCount,
  getUsersTasksCount,
} from "@/actions/dashboard/get-tasks-count";
import { getInvoicesCount } from "@/actions/dashboard/get-invoices-count";
import { getCampaignsCount } from "@/actions/dashboard/get-campaigns-count";
import { getTargetsCount } from "@/actions/dashboard/get-targets-count";
import { getLeadsCount } from "@/actions/dashboard/get-leads-count";
import { getBoardsCount } from "@/actions/dashboard/get-boards-count";
import { getStorageSize } from "@/actions/documents/get-storage-size";
import { getContactCount } from "@/actions/dashboard/get-contacts-count";
import { getAccountsCount } from "@/actions/dashboard/get-accounts-count";
import { getContractsCount } from "@/actions/dashboard/get-contracts-count";
import { getDocumentsCount } from "@/actions/dashboard/get-documents-count";
import { getActiveUsersCount } from "@/actions/dashboard/get-active-users-count";
import { getOpportunitiesCount } from "@/actions/dashboard/get-opportunities-count";
import { getExpectedRevenue } from "@/actions/crm/opportunity/get-expected-revenue";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { getDefaultCurrency, formatCurrency as formatCurrencyUtil } from "@/lib/currency";
import { Decimal } from "@prisma/client/runtime/client";
import { prismadb } from "@/lib/prisma";
import { leadReadScopeWhere } from "@/lib/authz";

const DashboardPage = async () => {
  const session = await getSession();

  if (!session) return null;

  const userId = session?.user?.id;

  const cookieStore = await cookies();
  const defaultCurrency = await getDefaultCurrency();
  const displayCurrency = cookieStore.get("display_currency")?.value || defaultCurrency;

  //Get user language
  const lang = session?.user?.userLanguage;

  //Fetch translations from dictionary
  const dict = await getTranslations("DashboardPage");
  const leads = await getLeadsCount();
  const tasks = await getTasksCount();
  const invoices = await getInvoicesCount();
  const campaigns = await getCampaignsCount();
  const targets = await getTargetsCount();
  const storage = await getStorageSize();
  const projects = await getBoardsCount();
  const contacts = await getContactCount();
  const contracts = await getContractsCount();
  const users = await getActiveUsersCount();
  const accounts = await getAccountsCount();
  const revenue = await getExpectedRevenue(displayCurrency);
  const documents = await getDocumentsCount();
  const opportunities = await getOpportunitiesCount();
  const usersTasks = await getUsersTasksCount(userId);

  // Fetch detailed user profile for role verification and hierarchy layout
  const currentUser = await prismadb.users.findUnique({
    where: { id: userId },
    select: { id: true, role: true, region_id: true, area_id: true },
  });

  const userRole = currentUser?.role || "user";

  // 1. CEO / Admin List
  let ceoUsersList: any[] = [];
  if (userRole === "ceo" || userRole === "admin") {
    ceoUsersList = await prismadb.users.findMany({
      where: {
        role: {
          in: ["operations_director", "regional_director", "area_director", "channel_partner"],
        },
        userStatus: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        region_id: true,
        area_id: true,
        parent: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  // 2. Staff Map for showing names of assigned directors
  let staffMap: Record<string, string> = {};
  if (["operations_director", "regional_director", "area_director"].includes(userRole)) {
    const staff = await prismadb.users.findMany({
      where: {
        role: { in: ["regional_director", "area_director", "channel_partner"] },
      },
      select: { id: true, name: true, email: true },
    });
    staff.forEach((s) => {
      staffMap[s.id] = s.name || s.email;
    });
  }

  // 3. Operations Director Leads List
  let odLeadsList: any[] = [];
  if (userRole === "operations_director") {
    odLeadsList = await prismadb.crm_Leads.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        postcode: true,
        lead_status: { select: { name: true } },
        assigned_regional_director_id: true,
        assigned_area_director_id: true,
        assigned_partner_id: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  // 4. Regional Director Dashboard Lists
  let rdUsersList: any[] = [];
  let rdLeadsList: any[] = [];
  if (userRole === "regional_director") {
    if (currentUser?.region_id) {
      rdUsersList = await prismadb.users.findMany({
        where: {
          region_id: currentUser.region_id,
          role: { in: ["area_director", "channel_partner"] },
          userStatus: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          area_id: true,
        },
        orderBy: { name: "asc" },
      });
    }

    const leadScope = await leadReadScopeWhere({
      id: userId,
      role: userRole,
      region_id: currentUser?.region_id,
      area_id: currentUser?.area_id,
    });
    rdLeadsList = await prismadb.crm_Leads.findMany({
      where: leadScope,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        postcode: true,
        lead_status: { select: { name: true } },
        assigned_area_director_id: true,
        assigned_partner_id: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  // 5. Area Director Dashboard Lists
  let adUsersList: any[] = [];
  let adLeadsList: any[] = [];
  if (userRole === "area_director") {
    if (currentUser?.area_id) {
      adUsersList = await prismadb.users.findMany({
        where: {
          area_id: currentUser.area_id,
          role: "channel_partner",
          userStatus: "ACTIVE",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: { name: "asc" },
      });
    }

    const leadScope = await leadReadScopeWhere({
      id: userId,
      role: userRole,
      region_id: currentUser?.region_id,
      area_id: currentUser?.area_id,
    });
    adLeadsList = await prismadb.crm_Leads.findMany({
      where: leadScope,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        postcode: true,
        lead_status: { select: { name: true } },
        assigned_partner_id: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  // 6. Channel Partner Leads List
  let cpLeadsList: any[] = [];
  if (userRole === "channel_partner") {
    const leadScope = await leadReadScopeWhere({
      id: userId,
      role: userRole,
      region_id: currentUser?.region_id,
      area_id: currentUser?.area_id,
    });
    cpLeadsList = await prismadb.crm_Leads.findMany({
      where: leadScope,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        postcode: true,
        lead_status: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }

  return (
    <Container
      title={dict("containerTitle")}
      description={
        "Welcome to NextCRM cockpit, here you can see your company overview"
      }
    >
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Suspense fallback={<LoadingBox />}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {dict("totalRevenue")}
              </CardTitle>
              <DollarSignIcon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium">{"0"}</div>
            </CardContent>
          </Card>
        </Suspense>
        <Suspense fallback={<LoadingBox />}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {dict("expectedRevenue")}
              </CardTitle>
              <DollarSignIcon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-medium">
                {formatCurrencyUtil(new Decimal(revenue), displayCurrency)}
              </div>
            </CardContent>
          </Card>
        </Suspense>

        <DashboardCard
          href="/admin/users"
          title={dict("activeUsers")}
          IconComponent={UserIcon}
          content={users}
        />
        <DashboardCard
          href="/invoices"
          title={dict("invoices")}
          IconComponent={FileText}
          content={invoices}
        />
        <DashboardCard
          href="/campaigns"
          title={dict("campaigns")}
          IconComponent={Megaphone}
          content={campaigns}
        />
        <DashboardCard
          href="/crm/targets"
          title={dict("targets")}
          IconComponent={Target}
          content={targets}
        />
        <DashboardCard
          href="/crm/accounts"
          title={dict("accounts")}
          IconComponent={LandmarkIcon}
          content={accounts}
        />
        <DashboardCard
          href="/crm/opportunities"
          title={dict("opportunities")}
          IconComponent={HeartHandshakeIcon}
          content={opportunities}
        />
        <DashboardCard
          href="/crm/contacts"
          title={dict("contacts")}
          IconComponent={Contact}
          content={contacts}
        />
        <DashboardCard
          href="/crm/leads"
          title={dict("leads")}
          IconComponent={CoinsIcon}
          content={leads}
        />
        <DashboardCard
          href="/crm/contracts"
          title={dict("contracts")}
          IconComponent={FilePenLine}
          content={contracts}
        />
        <DashboardCard
          href="/projects"
          title={dict("projects")}
          IconComponent={CoinsIcon}
          content={projects}
        />
        <DashboardCard
          href="/projects/tasks"
          title={dict("tasks")}
          IconComponent={CoinsIcon}
          content={tasks}
        />
        <DashboardCard
          href={`/projects/tasks/${userId}`}
          title={dict("myTasks")}
          IconComponent={CoinsIcon}
          content={usersTasks}
        />
        <DashboardCard
          href="/documents"
          title={dict("documents")}
          IconComponent={CoinsIcon}
          content={documents}
        />

        <StorageQuota actual={storage} title={dict("storage")} />
      </div>

      {/* CEO & Admin Dashboard Table */}
      {(userRole === "ceo" || userRole === "admin") && (
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Operations, Regional & Area Directors</h2>
          <div className="rounded-md border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="pb-3 font-medium">Name</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Role</th>
                      <th className="pb-3 font-medium">Region ID</th>
                      <th className="pb-3 font-medium">Area ID</th>
                      <th className="pb-3 font-medium">Reporting To (Supervisor)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted">
                    {ceoUsersList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-muted-foreground">No staff members found.</td>
                      </tr>
                    ) : (
                      ceoUsersList.map((u) => (
                        <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                          <td className="py-3 font-medium">{u.name || "N/A"}</td>
                          <td className="py-3 text-muted-foreground">{u.email}</td>
                          <td className="py-3 capitalize font-semibold text-primary">{u.role.replace(/_/g, " ")}</td>
                          <td className="py-3 font-mono">{u.region_id ?? "N/A"}</td>
                          <td className="py-3 font-mono">{u.area_id ?? "N/A"}</td>
                          <td className="py-3 text-muted-foreground">{u.parent ? (u.parent.name || u.parent.email) : "None"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operations Director Dashboard Table */}
      {userRole === "operations_director" && (
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Global Lead Routing & Staff Assignments</h2>
          <div className="rounded-md border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="pb-3 font-medium">Lead Name</th>
                      <th className="pb-3 font-medium">Company</th>
                      <th className="pb-3 font-medium">Postcode</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Regional Director</th>
                      <th className="pb-3 font-medium">Area Director</th>
                      <th className="pb-3 font-medium">Channel Partner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted">
                    {odLeadsList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-muted-foreground">No active leads found.</td>
                      </tr>
                    ) : (
                      odLeadsList.map((lead) => (
                        <tr key={lead.id} className="hover:bg-muted/50 transition-colors">
                          <td className="py-3 font-medium">{lead.firstName} {lead.lastName}</td>
                          <td className="py-3 text-muted-foreground">{lead.company || "N/A"}</td>
                          <td className="py-3 font-mono">{lead.postcode || "N/A"}</td>
                          <td className="py-3">
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                              {lead.lead_status?.name || "New"}
                            </span>
                          </td>
                          <td className="py-3 text-muted-foreground">{lead.assigned_regional_director_id ? (staffMap[lead.assigned_regional_director_id] || "Assigned") : "Unassigned"}</td>
                          <td className="py-3 text-muted-foreground">{lead.assigned_area_director_id ? (staffMap[lead.assigned_area_director_id] || "Assigned") : "Unassigned"}</td>
                          <td className="py-3 text-muted-foreground">{lead.assigned_partner_id ? (staffMap[lead.assigned_partner_id] || "Assigned") : "Unassigned"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regional Director Dashboard */}
      {userRole === "regional_director" && (
        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Area Directors & Channel Partners in Your Region</h2>
            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-muted">
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Role</th>
                        <th className="pb-3 font-medium">Area ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {rdUsersList.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-muted-foreground">No staff members assigned to your region.</td>
                        </tr>
                      ) : (
                        rdUsersList.map((u) => (
                          <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3 font-medium">{u.name || "N/A"}</td>
                            <td className="py-3 text-muted-foreground">{u.email}</td>
                            <td className="py-3 capitalize font-semibold text-primary">{u.role.replace(/_/g, " ")}</td>
                            <td className="py-3 font-mono">{u.area_id ?? "N/A"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Leads in Your Region</h2>
            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-muted">
                        <th className="pb-3 font-medium">Lead Name</th>
                        <th className="pb-3 font-medium">Company</th>
                        <th className="pb-3 font-medium">Postcode</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Area Director</th>
                        <th className="pb-3 font-medium">Channel Partner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {rdLeadsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-4 text-center text-muted-foreground">No leads found in your region.</td>
                        </tr>
                      ) : (
                        rdLeadsList.map((lead) => (
                          <tr key={lead.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3 font-medium">{lead.firstName} {lead.lastName}</td>
                            <td className="py-3 text-muted-foreground">{lead.company || "N/A"}</td>
                            <td className="py-3 font-mono">{lead.postcode || "N/A"}</td>
                            <td className="py-3">
                              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                                {lead.lead_status?.name || "New"}
                              </span>
                            </td>
                            <td className="py-3 text-muted-foreground">{lead.assigned_area_director_id ? (staffMap[lead.assigned_area_director_id] || "Assigned") : "Unassigned"}</td>
                            <td className="py-3 text-muted-foreground">{lead.assigned_partner_id ? (staffMap[lead.assigned_partner_id] || "Assigned") : "Unassigned"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Area Director Dashboard */}
      {userRole === "area_director" && (
        <div className="mt-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Channel Partners in Your Area</h2>
            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-muted">
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {adUsersList.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="py-4 text-center text-muted-foreground">No channel partners assigned to your area.</td>
                        </tr>
                      ) : (
                        adUsersList.map((u) => (
                          <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3 font-medium">{u.name || "N/A"}</td>
                            <td className="py-3 text-muted-foreground">{u.email}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Leads in Your Area</h2>
            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-muted">
                        <th className="pb-3 font-medium">Lead Name</th>
                        <th className="pb-3 font-medium">Company</th>
                        <th className="pb-3 font-medium">Postcode</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Channel Partner</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {adLeadsList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-muted-foreground">No leads found in your area.</td>
                        </tr>
                      ) : (
                        adLeadsList.map((lead) => (
                          <tr key={lead.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3 font-medium">{lead.firstName} {lead.lastName}</td>
                            <td className="py-3 text-muted-foreground">{lead.company || "N/A"}</td>
                            <td className="py-3 font-mono">{lead.postcode || "N/A"}</td>
                            <td className="py-3">
                              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                                {lead.lead_status?.name || "New"}
                              </span>
                            </td>
                            <td className="py-3 text-muted-foreground">{lead.assigned_partner_id ? (staffMap[lead.assigned_partner_id] || "Assigned") : "Unassigned"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Channel Partner Dashboard */}
      {userRole === "channel_partner" && (
        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Leads Assigned to You</h2>
          <div className="rounded-md border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-muted">
                      <th className="pb-3 font-medium">Lead Name</th>
                      <th className="pb-3 font-medium">Company</th>
                      <th className="pb-3 font-medium">Postcode</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted">
                    {cpLeadsList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-muted-foreground">No leads assigned to you.</td>
                      </tr>
                    ) : (
                      cpLeadsList.map((lead) => (
                        <tr key={lead.id} className="hover:bg-muted/50 transition-colors">
                          <td className="py-3 font-medium">{lead.firstName} {lead.lastName}</td>
                          <td className="py-3 text-muted-foreground">{lead.company || "N/A"}</td>
                          <td className="py-3 font-mono">{lead.postcode || "N/A"}</td>
                          <td className="py-3">
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                              {lead.lead_status?.name || "New"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
};

export default DashboardPage;

const DashboardCard = ({
  href,
  title,
  IconComponent,
  content,
}: {
  href?: string;
  title: string;
  IconComponent: any;
  content: number;
}) => (
  <Link href={href || "#"}>
    <Suspense fallback={<LoadingBox />}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <IconComponent className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-medium">{content}</div>
        </CardContent>
      </Card>
    </Suspense>
  </Link>
);
