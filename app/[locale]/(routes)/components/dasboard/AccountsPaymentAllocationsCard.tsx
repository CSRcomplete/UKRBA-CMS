"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Download,
  CheckCircle2,
  Clock,
  ArrowRight,
  Building2,
  Users,
  CreditCard,
} from "lucide-react";
import Link from "next/link";

interface AccountsPaymentAllocationsCardProps {
  allocations: any[];
  totalAllocatedSum: number;
  approvedCount: number;
  pendingCount: number;
  userRole: string;
}

export function AccountsPaymentAllocationsCard({
  allocations,
  totalAllocatedSum,
  approvedCount,
  pendingCount,
  userRole,
}: AccountsPaymentAllocationsCardProps) {
  const handleDownloadCSV = () => {
    window.open("/api/crm/payment-allocations/export", "_blank");
  };

  return (
    <Card className="shadow-md border border-primary/20 bg-card overflow-hidden">
      <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <CreditCard className="h-6 w-6 text-emerald-600" />
            Accounts & Payment Allocations
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Live customer sale allocations, partner commission splits, and accounts CSV export.
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleDownloadCSV}
            size="sm"
            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            <Download className="h-4 w-4" /> Download Accounts CSV
          </Button>

          <Button variant="outline" size="sm" asChild className="gap-1 text-xs">
            <Link href="/crm/contacts">
              View Contacts <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* KPI Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl border bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40">
            <span className="text-xs text-muted-foreground font-medium block">Total Allocated Revenue</span>
            <span className="text-xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
              £{totalAllocatedSum.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40">
            <span className="text-xs text-muted-foreground font-medium block">Approved Allocations</span>
            <span className="text-xl font-bold font-mono text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 inline" /> {approvedCount}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40">
            <span className="text-xs text-muted-foreground font-medium block">Pending Approvals</span>
            <span className="text-xl font-bold font-mono text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <Clock className="h-5 w-5 text-amber-500 inline" /> {pendingCount}
            </span>
          </div>
        </div>

        {/* Live Customer Allocations Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent Customer Payment Allocations
          </h4>

          {allocations.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted-foreground border-2 border-dashed rounded-lg">
              No live customer payment allocations recorded yet. Allocate payments under Contacts.
            </div>
          ) : (
            <div className="space-y-2">
              {allocations.map((alloc) => {
                const team = (alloc.team_allocations as any[]) || [];
                return (
                  <div
                    key={alloc.id}
                    className="p-3 rounded-lg border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/crm/contacts/${alloc.contact_id}`}
                          className="font-semibold text-sm hover:underline text-primary flex items-center gap-1.5"
                        >
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {alloc.customer_name}
                        </Link>
                        <Badge
                          variant={alloc.status === "approved" ? "default" : "secondary"}
                          className={`text-[10px] ${
                            alloc.status === "approved" ? "bg-emerald-600 text-white" : ""
                          }`}
                        >
                          {alloc.status === "approved" ? "Approved" : "Pending"}
                        </Badge>
                      </div>

                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                        <span>Sale: <strong>£{Number(alloc.sale_amount).toLocaleString("en-GB")}</strong></span>
                        <span>Allocated: <strong>{Number(alloc.total_percentage)}% (£{Number(alloc.total_allocated).toLocaleString("en-GB")})</strong></span>
                        {team.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {team.length} Team Members
                          </span>
                        )}
                        {alloc.partner_name && (
                          <span className="text-purple-600 dark:text-purple-400">
                            Partner: {alloc.partner_name} ({Number(alloc.partner_percentage)}%)
                          </span>
                        )}
                      </div>
                    </div>

                    <Button variant="ghost" size="sm" asChild className="text-xs gap-1 shrink-0">
                      <Link href={`/crm/contacts/${alloc.contact_id}`}>
                        View Details <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
