import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Phone, Users, FileText, Mail } from "lucide-react";

import Container from "../../components/ui/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getTeamActivity,
  getTeamActivityAuthors,
  type TeamActivityEntry,
} from "@/actions/crm/activities/get-team-activity";
import { ACTIVITY_TYPES } from "@/lib/team-activity";

const TYPE_ICONS = { call: Phone, meeting: Users, note: FileText, email: Mail } as const;
const TYPE_LABELS = { call: "Call", meeting: "Meeting", note: "Note", email: "Email" } as const;
const ROLE_LABELS: Record<string, string> = {
  regional_director: "Regional Director",
  area_director: "Area Director",
};

type SearchParams = {
  type?: string;
  user?: string;
  from?: string;
  to?: string;
  cursorDate?: string;
  cursorId?: string;
};

const selectClass =
  "h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

function ActivityRow({ a }: { a: TeamActivityEntry }) {
  const Icon = TYPE_ICONS[a.type];
  return (
    <div className="flex gap-3 py-4 border-b last:border-0">
      <div className="mt-1 flex-shrink-0 text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-sm">{a.title}</p>
          <Badge variant="outline" className="text-xs">{TYPE_LABELS[a.type]}</Badge>
          <Badge variant="secondary" className="text-xs">{a.status}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{a.createdBy?.name ?? "Unknown"}</span>
          {a.createdBy?.role && ROLE_LABELS[a.createdBy.role] ? ` (${ROLE_LABELS[a.createdBy.role]})` : ""}
          {" · "}
          {format(new Date(a.date), "d MMM yyyy, HH:mm")}
          {a.lead && (
            <>
              {" · on "}
              <Link href={`/crm/leads/${a.lead.id}`} className="font-medium text-primary hover:underline">
                {a.lead.name}
                {a.lead.company ? `, ${a.lead.company}` : ""}
              </Link>
            </>
          )}
        </p>
        {a.description && (
          <p className="text-sm whitespace-pre-wrap break-words">{a.description}</p>
        )}
        {a.outcome && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
            <span className="font-medium">Outcome:</span> {a.outcome}
          </p>
        )}
      </div>
    </div>
  );
}

/** Everything the RDs and ADs log against leads, in one place (admin / CEO / COO only). */
const TeamActivityPage = async (props: { searchParams: Promise<SearchParams> }) => {
  const sp = await props.searchParams;
  const filters = { type: sp.type, userId: sp.user, from: sp.from, to: sp.to };
  const cursor =
    sp.cursorDate && sp.cursorId ? { date: sp.cursorDate, id: sp.cursorId } : undefined;

  const [result, authors] = await Promise.all([
    getTeamActivity(filters, cursor),
    getTeamActivityAuthors(),
  ]);
  if (result === null) redirect("/crm");

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries({ type: sp.type, user: sp.user, from: sp.from, to: sp.to })) {
    if (v) qs.set(k, v);
  }
  const olderHref = result.nextCursor
    ? `?${new URLSearchParams({
        ...Object.fromEntries(qs),
        cursorDate: result.nextCursor.date,
        cursorId: result.nextCursor.id,
      }).toString()}`
    : null;

  return (
    <Container
      title="Team Activity"
      description="Notes, calls, meetings and emails logged by Regional and Area Directors."
    >
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Team Activity</CardTitle>
          <p className="text-sm text-muted-foreground">
            Everything Regional and Area Directors log against leads, newest first.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label htmlFor="user" className="text-xs font-semibold">Person</label>
              <select id="user" name="user" defaultValue={sp.user ?? ""} className={selectClass}>
                <option value="">All RDs and ADs</option>
                {authors.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({ROLE_LABELS[u.role ?? ""] ?? u.role})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="type" className="text-xs font-semibold">Type</label>
              <select id="type" name="type" defaultValue={sp.type ?? ""} className={selectClass}>
                <option value="">All types</option>
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label htmlFor="from" className="text-xs font-semibold">From</label>
              <Input id="from" name="from" type="date" defaultValue={sp.from ?? ""} className="h-9 w-40" />
            </div>
            <div className="space-y-1">
              <label htmlFor="to" className="text-xs font-semibold">To</label>
              <Input id="to" name="to" type="date" defaultValue={sp.to ?? ""} className="h-9 w-40" />
            </div>
            <Button type="submit" size="sm">Apply</Button>
            {(sp.type || sp.user || sp.from || sp.to) && (
              <Button asChild type="button" variant="ghost" size="sm">
                <Link href="/crm/team-activity">Reset</Link>
              </Button>
            )}
          </form>

          {result.data.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              No activity found{sp.type || sp.user || sp.from || sp.to ? " for these filters" : " yet"}.
            </p>
          ) : (
            <div>
              {result.data.map((a) => (
                <ActivityRow key={a.id} a={a} />
              ))}
            </div>
          )}

          {olderHref && (
            <div className="pt-2">
              <Button asChild variant="outline" size="sm">
                <Link href={olderHref}>Older activity</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default TeamActivityPage;
