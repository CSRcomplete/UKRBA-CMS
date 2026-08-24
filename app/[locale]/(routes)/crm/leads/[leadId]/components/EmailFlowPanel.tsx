"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle2, Circle, PartyPopper, AlertTriangle } from "lucide-react";
import type { LeadEmailFlowData } from "@/actions/crm/leads/get-lead-email-flow";

function StatusBanner({ status }: { status: LeadEmailFlowData["status"] }) {
  if (status === "customer_bought") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 p-3 text-sm font-medium">
        <PartyPopper className="h-4 w-4" />
        Customer purchased the Premium SME Plan — sequence stopped.
      </div>
    );
  }
  if (status === "completed_no_purchase") {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 p-3 text-sm font-medium">
        <AlertTriangle className="h-4 w-4" />
        Sequence completed — no purchase yet. Please follow up with this lead directly.
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 p-3 text-sm font-medium">
      <Mail className="h-4 w-4" />
      Email sequence in progress.
    </div>
  );
}

export function EmailFlowPanel({ flow }: { flow: LeadEmailFlowData }) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-4.5 w-4.5 text-violet-600" />
          £5 Assessment Email Flow
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <StatusBanner status={flow.status} />

        <div className="space-y-2">
          {flow.steps.map((step) => {
            const isExpanded = expandedStep === step.id;
            const isSent = !!step.sent_at;
            return (
              <div key={step.id} className="rounded-lg border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                  className="w-full flex items-center justify-between p-3 text-left hover:bg-accent/50 transition-colors"
                  disabled={!isSent}
                >
                  <div className="flex items-center gap-2.5">
                    {isSent ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="h-4.5 w-4.5 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className="text-sm font-medium">Email {step.step_number}</span>
                  </div>
                  {isSent ? (
                    <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">
                      Sent {format(parseISO(step.sent_at!), "MMM d, yyyy h:mm a")}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      Pending
                    </Badge>
                  )}
                </button>
                {isExpanded && isSent && (
                  <div className="p-4 border-t bg-muted/20 space-y-2">
                    <p className="text-sm font-semibold">{step.subject}</p>
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none text-sm"
                      dangerouslySetInnerHTML={{ __html: step.body }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
