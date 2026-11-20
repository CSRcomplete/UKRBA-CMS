import Link from "next/link";
import { Users, Sparkles, ArrowRight } from "lucide-react";
import { PledgesGatewayCard } from "./PledgesGatewayCard";

/** Chooser shown to admin / CEO / COO: regular leads, the Kevin Leads list, or Pledges. */
export function KevinLeadsGateway() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      <Link
        href="/crm/leads/all"
        className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-foreground/25"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-green/10 dark:bg-brand-green/30 text-brand-green dark:text-brand-green shadow-none transition-transform">
            <Users className="h-6 w-6" />
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:text-brand-green" />
        </div>
        <div className="mt-4 space-y-1">
          <h3 className="text-lg font-bold text-foreground group-hover:text-brand-green transition-colors">
            Leads
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            All regular CRM leads (excludes the Kevin list and pledges).
          </p>
        </div>
      </Link>

      <Link
        href="/crm/leads/kevin"
        className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-foreground/25"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-green/10 dark:bg-brand-green/30 text-brand-green dark:text-brand-green shadow-none transition-transform">
            <Sparkles className="h-6 w-6" />
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:text-brand-green" />
        </div>
        <div className="mt-4 space-y-1">
          <h3 className="text-lg font-bold text-foreground group-hover:text-brand-green transition-colors">
            Kevin Leads
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            Prospect list supplied by Kevin, for campaign management.
          </p>
        </div>
      </Link>

      <PledgesGatewayCard />
    </div>
  );
}
