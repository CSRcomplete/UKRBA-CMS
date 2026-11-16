import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SHORT_FIELDS: { key: string; label: string; link?: boolean }[] = [
  { key: "jobTitle", label: "Job title" },
  { key: "seniority", label: "Seniority" },
  { key: "industry", label: "Industry" },
  { key: "employeeCount", label: "Employees" },
  { key: "annualRevenue", label: "Annual revenue" },
  { key: "personalEmail", label: "Personal email" },
  { key: "companyEmail", label: "Company email" },
  { key: "website", label: "Website", link: true },
  { key: "personAddress", label: "Person location" },
  { key: "companyAddress", label: "Company address" },
  { key: "companyCity", label: "Company city" },
  { key: "linkedinUrl", label: "LinkedIn", link: true },
  { key: "companyLinkedinUrl", label: "Company LinkedIn", link: true },
  { key: "facebook", label: "Facebook" },
];

const LONG_FIELDS: { key: string; label: string }[] = [
  { key: "profileSummary", label: "Profile summary" },
  { key: "companySummary", label: "Company summary" },
];

const hasValue = (v: unknown) => typeof v === "string" && v.trim() !== "" && v.trim() !== "[]";

/** Prospect / enrichment details (e.g. from Kevin's contact list). Renders nothing when the lead has none. */
export function ProspectDetailsCard({ data }: { data: Record<string, any> }) {
  const short = SHORT_FIELDS.filter((f) => hasValue(data[f.key]));
  const long = LONG_FIELDS.filter((f) => hasValue(data[f.key]));
  if (short.length === 0 && long.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Prospect details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {short.length > 0 && (
          <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
            {short.map((f) => {
              const v = String(data[f.key]).trim();
              return (
                <div key={f.key} className="min-w-0">
                  <dt className="text-sm font-medium leading-none">{f.label}</dt>
                  <dd className="mt-1 break-words text-sm text-muted-foreground">
                    {f.link && /^https?:\/\//i.test(v) ? (
                      <a href={v} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {v}
                      </a>
                    ) : (
                      v
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
        {long.map((f) => (
          <div key={f.key}>
            <p className="text-sm font-medium leading-none">{f.label}</p>
            <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{String(data[f.key]).trim()}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
