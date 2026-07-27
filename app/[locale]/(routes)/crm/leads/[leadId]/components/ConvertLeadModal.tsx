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
import { Input } from "@/components/ui/input";
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

interface ConvertLeadModalProps {
  leadId: string;
  leadName: string;
  currentStatus?: string;
}

const PRESET_PLANS = [
  "5GBP Purchase",
  "SME Membership",
  "Gold SME Plan",
  "White Label Partner",
  "Corporate Partnership",
  "Custom Plan",
];

export function ConvertLeadModal({ leadId, leadName }: ConvertLeadModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("SME Membership");
  const [customPlan, setCustomPlan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const planToUse = selectedPlan === "Custom Plan" ? customPlan.trim() : selectedPlan;
    if (!planToUse) {
      toast.error("Please specify a plan name.");
      return;
    }

    setIsSubmitting(true);

    const res = await convertLeadToMember({
      leadId,
      planName: planToUse,
      changeReason: `Manual lead conversion to Subscribed Member (${planToUse})`,
    });

    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Lead successfully converted! Status updated to "${res.statusName}".`);
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
            Convert <span className="font-bold text-foreground">{leadName}</span> into a Contact and active Member. The lead status will be updated to <span className="font-semibold text-emerald-600 dark:text-emerald-400">Subscribed - [Plan]</span> while preserving regional ownership.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="planSelect" className="text-xs font-semibold">
              Membership Plan Purchased
            </Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger id="planSelect" className="text-xs">
                <SelectValue placeholder="Select plan..." />
              </SelectTrigger>
              <SelectContent>
                {PRESET_PLANS.map((plan) => (
                  <SelectItem key={plan} value={plan} className="text-xs">
                    {plan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlan === "Custom Plan" && (
            <div className="space-y-1.5">
              <Label htmlFor="customPlanInput" className="text-xs font-semibold">
                Custom Plan Name
              </Label>
              <Input
                id="customPlanInput"
                placeholder="e.g. Platinum Partner Package"
                value={customPlan}
                onChange={(e) => setCustomPlan(e.target.value)}
                required
                className="text-xs"
              />
            </div>
          )}

          <div className="p-3 bg-muted/60 rounded-xl border text-xs space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>What happens next:</span>
            </div>
            <ul className="list-disc list-inside text-muted-foreground space-y-0.5 pl-1">
              <li>Lead status changes to <span className="font-medium text-foreground">"Subscribed - {selectedPlan === "Custom Plan" ? customPlan || "Custom" : selectedPlan}"</span></li>
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
