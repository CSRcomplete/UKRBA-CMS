"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DollarSign,
  Percent,
  Users,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Save,
  ShieldAlert,
  Clock,
} from "lucide-react";
import {
  getContactPaymentAllocation,
  saveContactPaymentAllocation,
  approvePaymentAllocation,
  TeamAllocationItem,
} from "@/actions/crm/payment-allocations";

interface ContactPaymentAllocationTabProps {
  contactId: string;
  contactName: string;
}

export function ContactPaymentAllocationTab({ contactId, contactName }: ContactPaymentAllocationTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(false);

  const [allocationId, setAllocationId] = useState<string | null>(null);
  const [saleAmount, setSaleAmount] = useState<number>(1000);
  const [status, setStatus] = useState<string>("pending");
  const [currentUserRole, setCurrentUserRole] = useState<string>("user");
  const [activeUsers, setActiveUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);

  // 6 Team member allocation slots
  const [teamAllocations, setTeamAllocations] = useState<TeamAllocationItem[]>(
    Array.from({ length: 6 }, () => ({
      userId: "none",
      userName: "",
      percentage: 0,
      amount: 0,
    }))
  );

  // 1 External Partner slot
  const [partnerName, setPartnerName] = useState<string>("");
  const [partnerPercentage, setPartnerPercentage] = useState<number>(0);

  const isCeoOrAdmin =
    currentUserRole.toLowerCase() === "admin" || currentUserRole.toLowerCase() === "ceo" || currentUserRole.toLowerCase() === "coo";

  useEffect(() => {
    fetchData();
  }, [contactId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getContactPaymentAllocation(contactId);
      if (res.error) {
        toast.error(res.error);
        return;
      }

      if (res.currentUserRole) {
        setCurrentUserRole(res.currentUserRole);
      }

      if (res.activeUsers) {
        setActiveUsers(res.activeUsers);
      }

      if (res.allocation) {
        setAllocationId(res.allocation.id);
        setSaleAmount(res.allocation.sale_amount || 0);
        setStatus(res.allocation.status || "pending");
        setPartnerName(res.allocation.partner_name || "");
        setPartnerPercentage(res.allocation.partner_percentage || 0);

        // Load existing team allocations into the 6 slots
        const loadedTeam = res.allocation.team_allocations || [];
        const slots: TeamAllocationItem[] = Array.from({ length: 6 }, (_, index) => {
          if (loadedTeam[index]) {
            return {
              userId: loadedTeam[index].userId || "none",
              userName: loadedTeam[index].userName || "",
              percentage: loadedTeam[index].percentage || 0,
              amount: loadedTeam[index].amount || 0,
            };
          }
          return { userId: "none", userName: "", percentage: 0, amount: 0 };
        });
        setTeamAllocations(slots);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load payment allocations");
    } finally {
      setLoading(false);
    }
  };

  // Handler for team member dropdown selection
  const handleTeamUserChange = (index: number, userId: string) => {
    const updated = [...teamAllocations];
    const selectedUser = activeUsers.find((u) => u.id === userId);
    updated[index] = {
      ...updated[index],
      userId,
      userName: selectedUser ? selectedUser.name : "",
    };
    setTeamAllocations(updated);
  };

  // Handler for team member percentage change
  const handleTeamPercentageChange = (index: number, valStr: string) => {
    const val = parseFloat(valStr) || 0;
    const updated = [...teamAllocations];
    updated[index] = {
      ...updated[index],
      percentage: Math.max(0, Math.min(100, val)),
    };
    setTeamAllocations(updated);
  };

  // Calculations
  const calcTeamAllocations = teamAllocations.map((slot) => {
    const amt = (saleAmount * (slot.percentage || 0)) / 100;
    return { ...slot, amount: Number(amt.toFixed(2)) };
  });

  const calcPartnerAmount = Number(((saleAmount * (partnerPercentage || 0)) / 100).toFixed(2));

  const totalPercentage = Number(
    (
      calcTeamAllocations.reduce((sum, item) => sum + (item.percentage || 0), 0) +
      (partnerPercentage || 0)
    ).toFixed(2)
  );

  const totalAmount = Number(
    (
      calcTeamAllocations.reduce((sum, item) => sum + item.amount, 0) + calcPartnerAmount
    ).toFixed(2)
  );

  const handleSave = async () => {
    if (!isCeoOrAdmin) {
      toast.error("Security Restriction: Only CEO and Admin can save payment allocations.");
      return;
    }

    setSaving(true);
    try {
      const res = await saveContactPaymentAllocation({
        contactId,
        customerName: contactName,
        saleAmount,
        teamAllocations: calcTeamAllocations,
        partnerName,
        partnerPercentage,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Payment allocations saved successfully!");
        fetchData();
      }
    } catch (err: any) {
      toast.error("Failed to save allocation: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!isCeoOrAdmin) {
      toast.error("Security Restriction: Only CEO and Admin can approve payment allocations.");
      return;
    }

    setApproving(true);
    try {
      const res = await approvePaymentAllocation(contactId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Payment allocation approved!");
        setStatus("approved");
        fetchData();
      }
    } catch (err: any) {
      toast.error("Failed to approve allocation: " + err.message);
    } finally {
      setApproving(false);
    }
  };

  const handleDownloadCSV = () => {
    window.open(`/api/crm/payment-allocations/export?contactId=${contactId}`, "_blank");
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Loading payment allocation details...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-muted">
        <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              Live Sale Payment Allocation
            </CardTitle>
            <CardDescription>
              Allocate sale percentages across internal team members and external partners for {contactName}.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant={status === "approved" ? "default" : "secondary"}
              className={`text-xs px-2.5 py-1 flex items-center gap-1 ${
                status === "approved"
                  ? "bg-emerald-600 text-white"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300"
              }`}
            >
              {status === "approved" ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approved
                </>
              ) : (
                <>
                  <Clock className="h-3.5 w-3.5" /> Pending Approval
                </>
              )}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-slate-300 dark:border-slate-700"
              onClick={handleDownloadCSV}
            >
              <Download className="h-4 w-4" /> Download CSV for Accounts
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sale Amount Configuration Bar */}
          <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 flex-1 max-w-xs">
              <Label htmlFor="saleAmount" className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-emerald-500" /> Total Live Sale Amount (£)
              </Label>
              <Input
                id="saleAmount"
                type="number"
                step="0.01"
                disabled={!isCeoOrAdmin}
                value={saleAmount}
                onChange={(e) => setSaleAmount(parseFloat(e.target.value) || 0)}
                className="font-mono text-base font-semibold"
              />
            </div>

            {/* Total Allocation Summary Badges */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">Total Percentage Allocated</span>
                <span
                  className={`text-lg font-bold font-mono ${
                    totalPercentage > 100 ? "text-red-600" : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {totalPercentage}%
                </span>
              </div>

              <div className="text-right border-l pl-4">
                <span className="text-xs text-muted-foreground block">Total Amount Allocated</span>
                <span className="text-lg font-bold font-mono text-foreground">
                  £{totalAmount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {totalPercentage > 100 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>Warning: Total allocated percentage ({totalPercentage}%) exceeds 100%!</span>
            </div>
          )}

          {!isCeoOrAdmin && (
            <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="h-4 w-4 flex-shrink-0" />
              <span>Only CEO and Admin roles are authorized to edit allocation percentages or approve payment records.</span>
            </div>
          )}

          {/* ── 6 Internal Team Member Slots ─────────────────────────────────── */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Internal Team Member Allocations (Up to 6 Team Members)
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {calcTeamAllocations.map((slot, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border bg-card flex flex-col md:flex-row md:items-center gap-3 justify-between"
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs font-bold text-muted-foreground w-6">#{idx + 1}</span>
                    <Select
                      disabled={!isCeoOrAdmin}
                      value={slot.userId}
                      onValueChange={(val) => handleTeamUserChange(idx, val)}
                    >
                      <SelectTrigger className="w-full max-w-md text-xs">
                        <SelectValue placeholder="Select team member..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None (Unallocated Slot)</SelectItem>
                        {activeUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} ({user.email}) [{user.role}]
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Percentage input */}
                    <div className="flex items-center gap-1.5">
                      <Label className="text-xs text-muted-foreground">Percentage:</Label>
                      <div className="relative w-24">
                        <Input
                          type="number"
                          step="0.1"
                          disabled={!isCeoOrAdmin || slot.userId === "none"}
                          value={slot.percentage || 0}
                          onChange={(e) => handleTeamPercentageChange(idx, e.target.value)}
                          className="text-right pr-6 text-xs font-mono"
                        />
                        <Percent className="h-3 w-3 absolute right-2 top-2.5 opacity-40 pointer-events-none" />
                      </div>
                    </div>

                    {/* Calculated Amount */}
                    <div className="w-32 text-right">
                      <span className="text-[11px] text-muted-foreground block">Payment Amount</span>
                      <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        £{slot.amount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── 1 External Partner Slot ──────────────────────────────────────── */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Building2 className="h-4 w-4 text-purple-600" />
              External Partner Allocation (White Label Partner / Strategic Partner)
            </h3>

            <div className="p-3.5 rounded-lg border border-purple-200 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/10 flex flex-col md:flex-row md:items-center gap-3 justify-between">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <Label className="text-xs font-medium text-muted-foreground shrink-0">Partner Name:</Label>
                <Input
                  disabled={!isCeoOrAdmin}
                  placeholder="e.g., Apex White Label Partner, Strategic Affiliate Ltd"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="text-xs bg-white dark:bg-slate-950"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs text-muted-foreground">Percentage:</Label>
                  <div className="relative w-24">
                    <Input
                      type="number"
                      step="0.1"
                      disabled={!isCeoOrAdmin}
                      value={partnerPercentage || 0}
                      onChange={(e) => setPartnerPercentage(parseFloat(e.target.value) || 0)}
                      className="text-right pr-6 text-xs font-mono bg-white dark:bg-slate-950"
                    />
                    <Percent className="h-3 w-3 absolute right-2 top-2.5 opacity-40 pointer-events-none" />
                  </div>
                </div>

                <div className="w-32 text-right">
                  <span className="text-[11px] text-muted-foreground block">Payment Amount</span>
                  <span className="text-xs font-bold font-mono text-purple-600 dark:text-purple-400">
                    £{calcPartnerAmount.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons for CEO and Admin */}
          {isCeoOrAdmin && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleSave}
                disabled={saving}
                className="gap-1.5"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Save Allocations"}
              </Button>

              <Button
                onClick={handleApprove}
                disabled={approving || status === "approved"}
                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4" />
                {approving ? "Approving..." : status === "approved" ? "Allocation Approved" : "Approve Allocation"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
