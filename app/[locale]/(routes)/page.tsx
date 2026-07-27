import { getSession } from "@/lib/auth-server";
import { getTranslations } from "next-intl/server";
import Container from "./components/ui/Container";
import { prismadb } from "@/lib/prisma";
import { leadReadScopeWhere } from "@/lib/authz";
import Link from "next/link";
import moment from "moment";
import { getEscalationAlerts } from "@/lib/task-escalation";
import {
  Mail,
  FolderOpen,
  Calendar,
  CheckSquare,
  Users,
  Video,
  Megaphone,
  Upload,
  Briefcase,
  ArrowRight,
} from "lucide-react";

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

  const escalationAlerts = await getEscalationAlerts(userId);

  // Fetch personal tasks and meetings for the active user (My Workspace)
  const myTasks = await prismadb.tasks.findMany({
    where: {
      user: userId,
      taskStatus: "ACTIVE",
    },
    select: {
      id: true,
      title: true,
      dueDateAt: true,
      priority: true,
      taskStatus: true,
    },
    orderBy: { dueDateAt: "asc" },
    take: 10,
  });

  const rawMyMeetings = await prismadb.crm_Activities.findMany({
    where: {
      type: "meeting",
      deletedAt: null,
      OR: [
        { createdBy: userId },
        {
          links: {
            some: {
              entityType: "user",
              entityId: userId,
            },
          },
        },
      ],
    },
    include: {
      created_by_user: {
        select: { name: true, email: true, role: true },
      },
      links: true,
    },
    orderBy: { date: "desc" },
    take: 10,
  });

  const myMeetings = await Promise.all(
    rawMyMeetings.map(async (meeting) => {
      const inviteeLink = meeting.links.find(l => l.entityId !== meeting.createdBy);
      let inviteeName = "N/A";
      if (inviteeLink) {
        if (inviteeLink.entityType === "user") {
          const u = await prismadb.users.findUnique({
            where: { id: inviteeLink.entityId },
            select: { name: true, email: true },
          });
          inviteeName = u?.name || u?.email || "Unknown Staff";
        } else if (inviteeLink.entityType === "lead") {
          const l = await prismadb.crm_Leads.findUnique({
            where: { id: inviteeLink.entityId },
            select: { firstName: true, lastName: true },
          });
          inviteeName = l ? `${l.firstName} ${l.lastName}`.trim() : "Unknown Lead";
        }
      }
      return {
        ...meeting,
        inviteeName,
      };
    })
  );

  // 1. CEO / Admin Lists
  let operationsDirectors: any[] = [];
  let regionalDirectors: any[] = [];
  let areaDirectors: any[] = [];
  let channelPartners: any[] = [];
  let recentLeads: any[] = [];
  let recentTasks: any[] = [];
  let recentMeetings: any[] = [];

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

    const rawMeetings = await prismadb.crm_Activities.findMany({
      where: {
        type: "meeting",
        deletedAt: null,
      },
      include: {
        created_by_user: {
          select: { name: true, email: true, role: true },
        },
        links: true,
      },
      orderBy: { date: "desc" },
      take: 10,
    });

    recentMeetings = await Promise.all(
      rawMeetings.map(async (meeting) => {
        const inviteeLink = meeting.links.find(l => l.entityId !== meeting.createdBy);
        let inviteeName = "N/A";
        if (inviteeLink) {
          if (inviteeLink.entityType === "user") {
            const u = await prismadb.users.findUnique({
              where: { id: inviteeLink.entityId },
              select: { name: true, email: true },
            });
            inviteeName = u?.name || u?.email || "Unknown Staff";
          } else if (inviteeLink.entityType === "lead") {
            const l = await prismadb.crm_Leads.findUnique({
              where: { id: inviteeLink.entityId },
              select: { firstName: true, lastName: true },
            });
            inviteeName = l ? `${l.firstName} ${l.lastName}`.trim() : "Unknown Lead";
          }
        }
        return {
          ...meeting,
          inviteeName,
        };
      })
    );
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
        "Welcome to UKRBA cockpit, here you can see your company overview"
      }
    >
      {/* Quick Launch Navigation Tiles (Large Easy-to-Navigate Modules) */}
      <div className="mb-10 space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Main Modules & Navigation
          </h2>
          <p className="text-sm text-muted-foreground">
            Select any module below to quickly navigate to your workspace.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Emails */}
          <Link
            href="/emails"
            className="group relative overflow-hidden rounded-xl border border-blue-200 dark:border-blue-900/40 bg-gradient-to-br from-blue-500/10 via-background to-blue-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-blue-500/60"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md transition-transform group-hover:scale-110">
                <Mail className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="text-lg font-bold text-foreground group-hover:text-blue-600 transition-colors">
                1. Emails
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Inbox, Sent items, Drafts, Standard Templates & Signature editor.
              </p>
            </div>
          </Link>

          {/* 2. Resources */}
          <Link
            href="/repository"
            className="group relative overflow-hidden rounded-xl border border-amber-200 dark:border-amber-900/40 bg-gradient-to-br from-amber-500/10 via-background to-amber-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-amber-500/60"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500 text-white shadow-md transition-transform group-hover:scale-110">
                <FolderOpen className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-amber-600" />
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="text-lg font-bold text-foreground group-hover:text-amber-600 transition-colors">
                2. Resources
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Company documents, shared repository files & staff materials.
              </p>
            </div>
          </Link>

          {/* 3. Diary */}
          <Link
            href="/crm/calendar"
            className="group relative overflow-hidden rounded-xl border border-purple-200 dark:border-purple-900/40 bg-gradient-to-br from-purple-500/10 via-background to-purple-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-purple-500/60"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-600 text-white shadow-md transition-transform group-hover:scale-110">
                <Calendar className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-purple-600" />
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="text-lg font-bold text-foreground group-hover:text-purple-600 transition-colors">
                3. Diary
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Daily, Weekly & Monthly staff business calendar & meeting invites.
              </p>
            </div>
          </Link>

          {/* 4. Tasks */}
          <Link
            href="/projects/tasks"
            className="group relative overflow-hidden rounded-xl border border-cyan-200 dark:border-cyan-900/40 bg-gradient-to-br from-cyan-500/10 via-background to-cyan-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-cyan-500/60"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-600 text-white shadow-md transition-transform group-hover:scale-110">
                <CheckSquare className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-cyan-600" />
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="text-lg font-bold text-foreground group-hover:text-cyan-600 transition-colors">
                4. Tasks
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Assigned action items, to-do lists & project milestones.
              </p>
            </div>
          </Link>

          {/* 5. CRM (Leads etc) */}
          <Link
            href="/crm"
            className="group relative overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-500/10 via-background to-emerald-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-emerald-500/60"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md transition-transform group-hover:scale-110">
                <Users className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" />
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-600 transition-colors">
                5. CRM (Leads & Accounts)
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Lead management, members, contacts, pipeline & opportunities.
              </p>
            </div>
          </Link>

          {/* 6. Video Meetings */}
          <Link
            href="/crm/meetings"
            className="group relative overflow-hidden rounded-xl border border-rose-200 dark:border-rose-900/40 bg-gradient-to-br from-rose-500/10 via-background to-rose-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-rose-500/60"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-600 text-white shadow-md transition-transform group-hover:scale-110">
                <Video className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-rose-600" />
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="text-lg font-bold text-foreground group-hover:text-rose-600 transition-colors">
                6. Video Meetings
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Schedule video calls, join virtual rooms & meeting logs.
              </p>
            </div>
          </Link>

          {/* 7. News & Announcements */}
          <Link
            href="/news"
            className="group relative overflow-hidden rounded-xl border border-violet-200 dark:border-violet-900/40 bg-gradient-to-br from-violet-500/10 via-background to-violet-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-violet-500/60"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-600 text-white shadow-md transition-transform group-hover:scale-110">
                <Megaphone className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-violet-600" />
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="text-lg font-bold text-foreground group-hover:text-violet-600 transition-colors">
                7. News & Announcements
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Official UKRBA notices, staff updates, announcements & reports.
              </p>
            </div>
          </Link>

          {/* 8. Upload Leads */}
          <Link
            href="/crm/leads/upload"
            className="group relative overflow-hidden rounded-xl border border-teal-200 dark:border-teal-900/40 bg-gradient-to-br from-teal-500/10 via-background to-teal-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-teal-500/60"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-600 text-white shadow-md transition-transform group-hover:scale-110">
                <Upload className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-teal-600" />
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="text-lg font-bold text-foreground group-hover:text-teal-600 transition-colors">
                8. Upload Leads
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                Upload business leads individually or in bulk via CSV.
              </p>
            </div>
          </Link>
        </div>

        {/* 9. Recruitment Centre — Admin/CEO only */}
        {(userRole === "admin" || userRole === "ceo") && (
          <div className="mt-6">
            <h2 className="text-base font-semibold text-muted-foreground mb-3">Administration Only</h2>
            <Link
              href="/recruitment"
              className="group relative overflow-hidden rounded-xl border border-indigo-200 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-500/10 via-background to-indigo-500/5 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-indigo-500/60 flex items-center gap-5 max-w-md"
            >
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md transition-transform group-hover:scale-110">
                <Briefcase className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-foreground group-hover:text-indigo-600 transition-colors">9. Recruitment Centre</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Full candidate pipeline — CVs, interviews, offers &amp; signed contracts.</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-indigo-600" />
            </Link>
          </div>
        )}
      </div>
      {/* Escalation Alerts Section */}
      {escalationAlerts.length > 0 && (
        <div className="space-y-4 mb-8">
          <h2 className="text-xl font-bold tracking-tight text-red-600 dark:text-red-400 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span>Escalation Alerts</span>
            <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200">
              {escalationAlerts.length} action required
            </span>
          </h2>
          <div className="rounded-md border border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10 text-card-foreground shadow-sm">
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-red-200 dark:border-red-900 pb-3 font-medium text-red-700 dark:text-red-300">
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Title</th>
                      <th className="pb-3">Original Owner</th>
                      <th className="pb-3">Created At</th>
                      <th className="pb-3">Days Unchanged</th>
                      <th className="pb-3">Escalation Tier</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-100 dark:divide-red-950">
                    {escalationAlerts.map((alert: any) => (
                      <tr key={`${alert.type}-${alert.id}`} className="hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors">
                        <td className="py-3 font-medium capitalize">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            alert.type === "task" 
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                          }`}>
                            {alert.type}
                          </span>
                        </td>
                        <td className="py-3">
                          {alert.type === "task" ? (
                            <Link href={`/projects/tasks/viewtask/${alert.id}`} className="text-primary hover:underline font-semibold">
                              {alert.title}
                            </Link>
                          ) : (
                            <span className="font-semibold text-foreground">{alert.title}</span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="text-sm font-semibold">{alert.originalOwnerName}</div>
                          <div className="text-xs text-muted-foreground">{alert.originalOwnerEmail}</div>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {moment(alert.createdAt).format("MMM DD, YYYY")}
                        </td>
                        <td className="py-3 font-mono text-xs font-bold text-red-600 dark:text-red-400">
                          {alert.daysElapsed} days
                        </td>
                        <td className="py-3">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                            {alert.escalationLevel === 0 ? "Owner Alert" : `Escalation Level ${alert.escalationLevel}`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

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

          {/* Scheduled Meetings Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-between">
              <span>Recent Scheduled Meetings</span>
              <Link href="/crm/meetings" className="text-xs font-semibold text-primary hover:underline">View All Meetings</Link>
            </h2>
            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-muted">
                        <th className="pb-3 font-medium">Meeting Title</th>
                        <th className="pb-3 font-medium">Host</th>
                        <th className="pb-3 font-medium">Invitee</th>
                        <th className="pb-3 font-medium">Date & Time</th>
                        <th className="pb-3 font-medium">Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {recentMeetings.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-muted-foreground">No scheduled meetings found.</td>
                        </tr>
                      ) : (
                        recentMeetings.map((meeting) => (
                          <tr key={meeting.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3 font-medium">
                              <Link href="/crm/meetings" className="text-primary hover:underline font-semibold">
                                {meeting.title}
                              </Link>
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {meeting.created_by_user?.name || meeting.created_by_user?.email || "N/A"}
                              {meeting.created_by_user?.role ? ` (${
                                meeting.created_by_user.role === "ceo" ? "CEO - UKRBA SME" :
                                meeting.created_by_user.role === "operations_director" ? "Operations Director" :
                                meeting.created_by_user.role === "regional_director" ? "Regional Director" :
                                meeting.created_by_user.role === "area_director" ? "Area Director" :
                                meeting.created_by_user.role === "channel_partner" ? "Channel Partner" :
                                meeting.created_by_user.role === "admin" ? "Admin" : "Staff"
                              })` : ""}
                            </td>
                            <td className="py-3 text-muted-foreground">{meeting.inviteeName}</td>
                            <td className="py-3 text-xs text-muted-foreground">
                              {moment(meeting.date).format("MMM DD, YYYY - hh:mm A")}
                            </td>
                            <td className="py-3 text-xs">
                              {(meeting.metadata as any)?.meetingLink ? (
                                <a href={(meeting.metadata as any).meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                                  Join Meeting
                                </a>
                              ) : (
                                <span className="text-muted-foreground">No link</span>
                              )}
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

      {/* Personal Agenda Section (Meetings & Tasks assigned to/created by the logged-in user) */}
      <div className="mt-8 border-t pt-8 space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">My Workspace</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Assigned Tasks Card */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center justify-between">
              <span>My Assigned Tasks</span>
              <Link href="/projects/tasks" className="text-xs font-semibold text-primary hover:underline">Go to Tasks</Link>
            </h3>
            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-muted">
                        <th className="pb-2 font-medium">Task Title</th>
                        <th className="pb-2 font-medium">Priority</th>
                        <th className="pb-2 font-medium">Status</th>
                        <th className="pb-2 font-medium">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {myTasks.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-muted-foreground text-xs">No active tasks assigned to you.</td>
                        </tr>
                      ) : (
                        myTasks.map((task) => (
                          <tr key={task.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-2.5 font-medium">
                              <Link href="/projects/tasks" className="text-primary hover:underline font-semibold text-xs">
                                {task.title}
                              </Link>
                            </td>
                            <td className="py-2.5 capitalize text-xs font-semibold">{task.priority}</td>
                            <td className="py-2.5">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                task.taskStatus === "COMPLETE"
                                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                                  : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
                              }`}>
                                {task.taskStatus}
                              </span>
                            </td>
                            <td className="py-2.5 text-xs text-muted-foreground">
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

          {/* My Scheduled Meetings Card */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center justify-between">
              <span>My Scheduled Meetings</span>
              <Link href="/crm/meetings" className="text-xs font-semibold text-primary hover:underline">Go to Meetings</Link>
            </h3>
            <div className="rounded-md border bg-card text-card-foreground shadow-sm">
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-muted">
                        <th className="pb-2 font-medium">Meeting Title</th>
                        <th className="pb-2 font-medium">Invitee</th>
                        <th className="pb-2 font-medium">Date & Time</th>
                        <th className="pb-2 font-medium">Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {myMeetings.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-muted-foreground text-xs">No scheduled meetings found.</td>
                        </tr>
                      ) : (
                        myMeetings.map((meeting) => (
                          <tr key={meeting.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-2.5 font-medium">
                              <Link href="/crm/meetings" className="text-primary hover:underline font-semibold text-xs">
                                {meeting.title}
                              </Link>
                            </td>
                            <td className="py-2.5 text-muted-foreground text-xs">{meeting.inviteeName}</td>
                            <td className="py-2.5 text-xs text-muted-foreground">
                              {moment(meeting.date).format("MMM DD, YYYY - hh:mm A")}
                            </td>
                            <td className="py-2.5 text-xs">
                              {(meeting.metadata as any)?.meetingLink ? (
                                <a href={(meeting.metadata as any).meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">
                                  Join
                                </a>
                              ) : (
                                <span className="text-muted-foreground font-mono text-xs">-</span>
                              )}
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
      </div>
    </Container>
  );
};

export default DashboardPage;
