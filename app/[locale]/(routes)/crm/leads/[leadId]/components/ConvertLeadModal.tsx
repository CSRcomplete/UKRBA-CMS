"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Award, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { convertLeadToMember } from "@/actions/crm/leads/convert-lead-to-member";
import { SALES_STATUS_LABELS } from "@/lib/sales-status";
import { SalesStatus } from "@prisma/client";

interface ConvertLeadModalProps {
  leadId: string;
  leadName: string;
  currentStatus?: string;
}

const SALES_STATUS_OPTIONS = Object.entries(SALES_STATUS_LABELS) as [SalesStatus, string][];

export function ConvertLeadModal({ leadId, leadName }: ConvertLeadModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SalesStatus>("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    const res = await convertLeadToMember({
      leadId,
      salesStatus: selectedTier,
      changeReason: `Manual lead conversion — sales status set to ${SALES_STATUS_LABELS[selectedTier]}`,
    });

    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Lead successfully converted! Sales status set to "${SALES_STATUS_LABELS[selectedTier]}".`);
      setOpen(false);
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold shadow-sm">
          <Award className="h-4 w-4" />
          <span>Mark as Subscribed Member</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[485px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span>Convert Lead to Subscribed Member</span>
          </DialogTitle>
          <DialogDescription className="text-xs">
            Convert <span className="font-bold text-foreground">{leadName}</span> into a Contact and active Member. The lead's pipeline status will be set to <span className="font-semibold text-emerald-600 dark:text-emerald-400">Won / Customer</span> and its Sales Status set to the membership tier sold below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="tierSelect" className="text-xs font-semibold">
              Sales Status (Membership Tier Sold)
            </Label>
            <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v as SalesStatus)}>
              <SelectTrigger id="tierSelect" className="text-xs">
                <SelectValue placeholder="Select tier..." />
              </SelectTrigger>
              <SelectContent>
                {SALES_STATUS_OPTIONS.map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 bg-muted/60 rounded-xl border text-xs space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>What happens next:</span>
            </div>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5 pl-1">
              <li>Lead status changes to <span className="font-medium text-foreground">"Won / Customer"</span></li>
              <li>Sales status set to <span className="font-medium text-foreground">"{SALES_STATUS_LABELS[selectedTier]}"</span></li>
              <li>Contact profile created under <span className="font-medium text-foreground">crm_Contacts</span></li>
              <li>Active member created under <span className="font-medium text-foreground">crm_Members</span></li>
              <li>Assigned Regional/Area Directors remain attached for commission</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <Award className="h-4 w-4" />
                  <span>Confirm &amp; Convert</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
