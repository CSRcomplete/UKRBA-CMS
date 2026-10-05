"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateLeadSalesStatus } from "@/actions/crm/leads/update-lead-sales-status";
import { SALES_STATUS_LABELS } from "@/lib/sales-status";
import { SalesStatus } from "@prisma/client";

interface SalesStatusEditorProps {
  leadId: string;
  salesStatus: SalesStatus | null;
  canEdit: boolean;
}

export function SalesStatusEditor({ leadId, salesStatus, canEdit }: SalesStatusEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  if (!canEdit) {
    return salesStatus ? (
      <Badge variant="secondary">{SALES_STATUS_LABELS[salesStatus]}</Badge>
    ) : (
      <span className="text-sm text-muted-foreground">Not set</span>
    );
  }

  const handleChange = async (value: string) => {
    setSaving(true);
    const res = await updateLeadSalesStatus(leadId, value as SalesStatus);
    setSaving(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Sales status set to "${SALES_STATUS_LABELS[value as SalesStatus]}"`);
      router.refresh();
    }
  };

  return (
    <Select value={salesStatus ?? undefined} onValueChange={handleChange} disabled={saving}>
      <SelectTrigger className="h-8 w-[160px] text-xs">
        <SelectValue placeholder="Not set" />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(SALES_STATUS_LABELS) as [SalesStatus, string][]).map(([value, label]) => (
          <SelectItem key={value} value={value} className="text-xs">
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
