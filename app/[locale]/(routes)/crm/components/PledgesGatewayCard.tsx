import Link from "next/link";
import { HeartHandshake, ArrowRight } from "lucide-react";

/** Card linking to the separate Pledges section; shown beside the other leads choosers. */
export function PledgesGatewayCard() {
  return (
    <Link
      href="/crm/leads/pledges"
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-foreground/25"
    >
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-green/10 dark:bg-brand-green/30 text-brand-green dark:text-brand-green shadow-none transition-transform">
          <HeartHandshake className="h-6 w-6" />
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:text-brand-green" />
      </div>
      <div className="mt-4 space-y-1">
        <h3 className="text-lg font-bold text-foreground group-hover:text-brand-green transition-colors">
          Pledges
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          Businesses that have taken the pledge, ready to be followed up.
        </p>
      </div>
    </Link>
  );
}
