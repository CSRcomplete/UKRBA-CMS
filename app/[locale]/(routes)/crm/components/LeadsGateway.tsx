import Link from "next/link";
import { User, Users, ArrowRight } from "lucide-react";

export function LeadsGateway() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <Link
        href="/crm/leads/mine"
        className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-foreground/25"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-blue/10 dark:bg-brand-blue/30 text-brand-blue dark:text-brand-blue shadow-none transition-transform">
            <User className="h-6 w-6" />
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:text-brand-blue" />
        </div>
        <div className="mt-4 space-y-1">
          <h3 className="text-lg font-bold text-foreground group-hover:text-brand-blue transition-colors">
            My Leads
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            Leads directly assigned to you.
          </p>
        </div>
      </Link>

      <Link
        href="/crm/leads/team"
        className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-foreground/25"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-blue/10 dark:bg-brand-blue/30 text-brand-blue dark:text-brand-blue shadow-none transition-transform">
            <Users className="h-6 w-6" />
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:text-brand-blue" />
        </div>
        <div className="mt-4 space-y-1">
          <h3 className="text-lg font-bold text-foreground group-hover:text-brand-blue transition-colors">
            Team Leads
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            Leads belonging to the people you supervise.
          </p>
        </div>
      </Link>
    </div>
  );
}
