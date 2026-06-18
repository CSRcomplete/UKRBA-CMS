import { getSession } from "@/lib/auth-server";
import { getTranslations } from "next-intl/server";
import Container from "./components/ui/Container";
import { prismadb } from "@/lib/prisma";
import { leadReadScopeWhere } from "@/lib/authz";
import Link from "next/link";
import moment from "moment";

const DashboardPage = async () => {
  const session = await getSession();

  if (!session) return null;

  const userId = session?.user?.id;

  //Fetch translations from dictionary
  const dict = await getTranslations("DashboardPage");

  // Fetch detailed user profile for role verification and hierarchy layout
  const currentUser = await prismadb.users.findUnique({
    where: { id: userId },
    select: { id: true, role: true, region_id: true, area_id: true },
  });

  const userRole = currentUser?.role || "user";

  // 1. CEO / Admin Lists
  let operationsDirectors: any[] = [];
  let regionalDirectors: any[] = [];
  let areaDirectors: any[] = [];
  let channelPartners: any[] = [];
  let recentLeads: any[] = [];
  let recentTasks: any[] = [];

  if (userRole === "ceo" || userRole === "admin") {
    const allUsers = await prismadb.users.findMany({
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

    operationsDirectors = allUsers.filter(u => u.role === "operations_director");
    regionalDirectors = allUsers.filter(u => u.role === "regional_director");
    areaDirectors = allUsers.filter(u => u.role === "area_director");
    channelPartners = allUsers.filter(u => u.role === "channel_partner");

    recentLeads = await prismadb.crm_Leads.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        postcode: true,
        lead_status: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    recentTasks = await prismadb.tasks.findMany({
      select: {
        id: true,
        title: true,
        dueDateAt: true,
        priority: true,
        taskStatus: true,
        assigned_user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
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
      {/* Standard Welcome Message for roles without custom tables */}
      {!["ceo", "admin", "operations_director", "regional_director", "area_director", "channel_partner"].includes(userRole) && (
        <div className="rounded-md border bg-card p-6 shadow-sm">
          <p className="text-muted-foreground text-center">
            Welcome to UKRBA CRM. Please select a module from the sidebar navigation to get started.
          </p>
        </div>
      )}

      {/* CEO & Admin Dashboard Sections */}
      {(userRole === "ceo" || userRole === "admin") && (
        <div className="space-y-8">
          {/* Operations Directors Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-between">
              <span>Operations Directors</span>
              <div className="flex items-center gap-4">
                <span className="text-xs font-normal text-muted-foreground">{operationsDirectors.length} active</span>
                <Link href="/admin/users" className="text-xs font-semibold text-primary hover:underline">View All Operations Directors</Link>
              </div>
            </h2>
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
                      {operationsDirectors.length === 0 ? (
                        <tr>
                          <td colSpan={2} className="py-4 text-center text-muted-foreground">No Operations Directors found.</td>
                        </tr>
                      ) : (
                        operationsDirectors.map((u) => (
                          <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3 font-medium">
                              <Link href={`/admin/users/${u.id}`} className="text-primary hover:underline font-semibold">
                                {u.name || "N/A"}
                              </Link>
                            </td>
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

          {/* Regional Directors Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-between">
              <span>Regional Directors</span>
              <div className="flex items-center gap-4">
                <span className="text-xs font-normal text-muted-foreground">{regionalDirectors.length} active</span>
                <Link href="/admin/users" className="text-xs font-semibold text-primary hover:underline">View All Regional Directors</Link>
              </div>
            </h2>
            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-muted">
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Region ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {regionalDirectors.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-muted-foreground">No Regional Directors found.</td>
                        </tr>
                      ) : (
                        regionalDirectors.map((u) => (
                          <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3 font-medium">
                              <Link href={`/admin/users/${u.id}`} className="text-primary hover:underline font-semibold">
                                {u.name || "N/A"}
                              </Link>
                            </td>
                            <td className="py-3 text-muted-foreground">{u.email}</td>
                            <td className="py-3 font-mono text-xs">{u.region_id ?? "N/A"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Area Directors Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-between">
              <span>Area Directors</span>
              <div className="flex items-center gap-4">
                <span className="text-xs font-normal text-muted-foreground">{areaDirectors.length} active</span>
                <Link href="/admin/users" className="text-xs font-semibold text-primary hover:underline">View All Area Directors</Link>
              </div>
            </h2>
            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-muted">
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Area ID</th>
                        <th className="pb-3 font-medium">Reporting To</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {areaDirectors.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-muted-foreground">No Area Directors found.</td>
                        </tr>
                      ) : (
                        areaDirectors.map((u) => (
                          <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3 font-medium">
                              <Link href={`/admin/users/${u.id}`} className="text-primary hover:underline font-semibold">
                                {u.name || "N/A"}
                              </Link>
                            </td>
                            <td className="py-3 text-muted-foreground">{u.email}</td>
                            <td className="py-3 font-mono text-xs">{u.area_id ?? "N/A"}</td>
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

          {/* Channel Partners Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-between">
              <span>Channel Partners</span>
              <div className="flex items-center gap-4">
                <span className="text-xs font-normal text-muted-foreground">{channelPartners.length} active</span>
                <Link href="/admin/users" className="text-xs font-semibold text-primary hover:underline">View All Channel Partners</Link>
              </div>
            </h2>
            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-muted">
                        <th className="pb-3 font-medium">Name</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Reporting To (Area Director)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {channelPartners.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-muted-foreground">No Channel Partners found.</td>
                        </tr>
                      ) : (
                        channelPartners.map((u) => (
                          <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3 font-medium">
                              <Link href={`/admin/users/${u.id}`} className="text-primary hover:underline font-semibold">
                                {u.name || "N/A"}
                              </Link>
                            </td>
                            <td className="py-3 text-muted-foreground">{u.email}</td>
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

          {/* Leads Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-between">
              <span>Recent CRM Leads</span>
              <Link href="/crm/leads" className="text-xs font-semibold text-primary hover:underline">View All Leads</Link>
            </h2>
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
                      {recentLeads.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-muted-foreground">No active leads found.</td>
                        </tr>
                      ) : (
                        recentLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3 font-medium">
                              <Link href={`/crm/leads/${lead.id}`} className="text-primary hover:underline font-semibold">
                                {lead.firstName} {lead.lastName}
                              </Link>
                            </td>
                            <td className="py-3 text-muted-foreground">{lead.company || "N/A"}</td>
                            <td className="py-3 font-mono text-xs">{lead.postcode || "N/A"}</td>
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

          {/* Tasks Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-between">
              <span>Recent Tasks & Actions</span>
              <Link href="/projects/tasks" className="text-xs font-semibold text-primary hover:underline">View All Tasks</Link>
            </h2>
            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-muted">
                        <th className="pb-3 font-medium">Task Title</th>
                        <th className="pb-3 font-medium">Assigned To</th>
                        <th className="pb-3 font-medium">Priority</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {recentTasks.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-muted-foreground">No tasks found.</td>
                        </tr>
                      ) : (
                        recentTasks.map((task) => (
                          <tr key={task.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3 font-medium">
                              <Link href="/projects/tasks" className="text-primary hover:underline font-semibold">
                                {task.title}
                              </Link>
                            </td>
                            <td className="py-3 text-muted-foreground">{task.assigned_user?.name || "Unassigned"}</td>
                            <td className="py-3 capitalize text-xs font-semibold">{task.priority}</td>
                            <td className="py-3">
                              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                task.taskStatus === "COMPLETE"
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                  : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                              }`}>
                                {task.taskStatus}
                              </span>
                            </td>
                            <td className="py-3 text-xs text-muted-foreground">
                              {task.dueDateAt ? moment(task.dueDateAt).format("MMM DD, YYYY") : "No due date"}
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
        </div>
      )}

      {/* Operations Director Dashboard Table */}
      {userRole === "operations_director" && (
        <div className="space-y-4">
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
                          <td className="py-3 font-medium">
                            <Link href={`/crm/leads/${lead.id}`} className="font-medium text-primary hover:underline">
                              {lead.firstName} {lead.lastName}
                            </Link>
                          </td>
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
        <div className="space-y-6">
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
                            <td className="py-3 font-medium">
                              <Link href={`/crm/leads/${lead.id}`} className="font-medium text-primary hover:underline">
                                {lead.firstName} {lead.lastName}
                              </Link>
                            </td>
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
        <div className="space-y-6">
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
                            <td className="py-3 font-medium">
                              <Link href={`/crm/leads/${lead.id}`} className="font-medium text-primary hover:underline">
                                {lead.firstName} {lead.lastName}
                              </Link>
                            </td>
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
        <div className="space-y-4">
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
                          <td className="py-3 font-medium">
                            <Link href={`/crm/leads/${lead.id}`} className="font-medium text-primary hover:underline">
                              {lead.firstName} {lead.lastName}
                            </Link>
                          </td>
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
