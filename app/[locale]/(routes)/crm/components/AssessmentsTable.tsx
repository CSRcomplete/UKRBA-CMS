"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronRight, ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AssessmentRow } from "@/actions/crm/get-assessments";
import { assessmentQuestionLabel, formatAssessmentAnswer } from "@/lib/assessment-questions";

function ReportCell({ row }: { row: AssessmentRow }) {
  if (row.reportUrl) {
    return (
      <a
        href={row.reportUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 text-primary hover:underline"
      >
        <FileText className="h-4 w-4" />
        View report
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }
  return (
    <Badge variant="outline" className="text-amber-700 border-amber-300">
      Generating
    </Badge>
  );
}

export function AssessmentsTable({
  rows,
  showLeadColumns = true,
}: {
  rows: AssessmentRow[];
  /** Hide business/RD/AD columns on a single lead's page, where they're redundant. */
  showLeadColumns?: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.businessName, r.contactName, r.email, r.postcode, r.regionalDirector, r.areaDirector]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [rows, query]);

  const colSpan = showLeadColumns ? 8 : 5;

  return (
    <div className="space-y-3">
      {showLeadColumns && (
        <Input
          placeholder="Search business, contact, email, postcode, RD or AD…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Submitted</TableHead>
              {showLeadColumns && <TableHead>Business</TableHead>}
              <TableHead>Contact</TableHead>
              {showLeadColumns && <TableHead>Regional Director</TableHead>}
              {showLeadColumns && <TableHead>Area Director</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Report</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center text-muted-foreground py-8">
                  No assessments received yet.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((row) => {
              const isOpen = expanded === row.id;
              const answerEntries = Object.entries(row.answers ?? {});
              return (
                <Fragment key={row.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : row.id)}
                  >
                    <TableCell>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(parseISO(row.submittedAt), "dd MMM yyyy HH:mm")}
                    </TableCell>
                    {showLeadColumns && (
                      <TableCell>
                        <div className="font-medium">{row.businessName || "—"}</div>
                        {row.leadId ? (
                          <Link
                            href={`/crm/leads/${row.leadId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-primary hover:underline"
                          >
                            Open lead
                          </Link>
                        ) : (
                          <Badge variant="outline" className="text-xs text-red-600 border-red-300">
                            Unmatched
                          </Badge>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      <div>{row.contactName || "—"}</div>
                      <div className="text-xs text-muted-foreground">{row.email}</div>
                    </TableCell>
                    {showLeadColumns && <TableCell>{row.regionalDirector || "—"}</TableCell>}
                    {showLeadColumns && <TableCell>{row.areaDirector || "—"}</TableCell>}
                    <TableCell>{row.assessmentType}</TableCell>
                    <TableCell>
                      <ReportCell row={row} />
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow>
                      <TableCell colSpan={colSpan} className="bg-muted/40">
                        <div className="grid gap-x-8 gap-y-2 p-2 md:grid-cols-2 text-sm">
                          <Detail label="Business" value={row.businessName} />
                          <Detail label="Postcode" value={row.postcode} />
                          <Detail label="Phone" value={row.phone} />
                          <Detail label="Website" value={row.website} />
                          <Detail label="Membership number" value={row.membershipNumber} />
                          {answerEntries.map(([key, value]) => (
                            <Detail
                              key={key}
                              label={assessmentQuestionLabel(key)}
                              value={formatAssessmentAnswer(value)}
                            />
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="break-words">{value || "—"}</div>
    </div>
  );
}
