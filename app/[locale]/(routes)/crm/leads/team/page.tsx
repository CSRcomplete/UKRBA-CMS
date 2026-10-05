import Link from "next/link";
import { Users, User, ArrowRight } from "lucide-react";

import Container from "../../../components/ui/Container";
import { getDirectReports } from "@/actions/crm/leads/get-team-leads";

function roleLabel(role: string | null): string {
  if (!role) return "";
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const TeamLeadsPage = async () => {
  const reports = await getDirectReports();

  return (
    <Container
      title="Team Leads"
      description="Leads belonging to the people you supervise."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Link
          href="/crm/leads/team/all"
          className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-foreground/25"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 shadow-none transition-transform group-hover:scale-110">
              <Users className="h-6 w-6" />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-violet-600" />
          </div>
          <div className="mt-4 space-y-1">
            <h3 className="text-lg font-bold text-foreground group-hover:text-violet-600 transition-colors">
              All Team Leads
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              Every lead across your whole team, combined.
            </p>
          </div>
        </Link>

        {reports.map((r) => (
          <Link
            key={r.id}
            href={`/crm/leads/team/${r.id}`}
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-foreground/25"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 shadow-none transition-transform group-hover:scale-110">
                <User className="h-6 w-6" />
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-blue-600" />
            </div>
            <div className="mt-4 space-y-1">
              <h3 className="text-lg font-bold text-foreground group-hover:text-blue-600 transition-colors">
                {r.name || r.email}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {roleLabel(r.role)} — {r.leadCount} lead{r.leadCount === 1 ? "" : "s"}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {reports.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center bg-card">
          <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-semibold">No one reports to you yet</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Once staff are assigned under you, they'll show up here.
          </p>
        </div>
      )}
    </Container>
  );
};

export default TeamLeadsPage;
