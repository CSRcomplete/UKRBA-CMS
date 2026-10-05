"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createTargetListFromLeads } from "@/actions/crm/leads/create-target-list-from-leads";
import { LeadAudiencePicker, type PostcodeOption, type AudienceLead } from "@/components/crm/leads/LeadAudiencePicker";

type TargetList = {
  id: string;
  name: string;
  _count: { targets: number };
};

type Props = {
  initialData: { target_list_ids?: string[] };
  targetLists: TargetList[];
  postcodeOptions: PostcodeOption[];
  leads: AudienceLead[];
  onNext: (data: { target_list_ids: string[] }) => void;
  onBack: () => void;
};

export function Step3Audience({
  initialData,
  targetLists,
  postcodeOptions,
  leads,
  onNext,
  onBack,
}: Props) {
  const [savedListIds, setSavedListIds] = useState<Set<string>>(
    new Set(initialData.target_list_ids ?? [])
  );
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);

  const toggleSavedList = (id: string) => {
    setSavedListIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedAreas = new Set(
    leads.filter((l) => selectedLeadIds.has(l.id) && l.postcodeArea).map((l) => l.postcodeArea)
  );

  const savedListRecipients = targetLists
    .filter((l) => savedListIds.has(l.id))
    .reduce((sum, l) => sum + l._count.targets, 0);

  const totalRecipients = selectedLeadIds.size + savedListRecipients;

  const handleNext = async () => {
    if (selectedLeadIds.size === 0 && savedListIds.size === 0) {
      setError("Select at least one lead, postcode, or saved target list");
      return;
    }
    setError("");

    const finalListIds = Array.from(savedListIds);

    if (selectedLeadIds.size > 0) {
      setIsBuilding(true);
      const label = selectedAreas.size > 0
        ? `Campaign audience — ${Array.from(selectedAreas).join(", ")} (${selectedLeadIds.size} leads) — ${new Date().toLocaleDateString("en-GB")}`
        : `Campaign audience — ${selectedLeadIds.size} leads — ${new Date().toLocaleDateString("en-GB")}`;

      const res = await createTargetListFromLeads(Array.from(selectedLeadIds), label);
      setIsBuilding(false);

      if (res.error) {
        toast.error(res.error);
        return;
      }
      finalListIds.push(res.targetListId!);
    }

    onNext({ target_list_ids: finalListIds });
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <LeadAudiencePicker
        postcodeOptions={postcodeOptions}
        leads={leads}
        selectedLeadIds={selectedLeadIds}
        onChange={setSelectedLeadIds}
      />

      {/* Saved target lists (optional, additive) */}
      {targetLists.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Also include saved target lists (optional)</label>
          <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border rounded-md p-2">
            {targetLists.map((l) => (
              <label
                key={l.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={savedListIds.has(l.id)}
                  onChange={() => toggleSavedList(l.id)}
                />
                <span className="text-sm">{l.name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {l._count.targets} targets
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {totalRecipients > 0 && (
        <p className="text-sm text-muted-foreground">
          ~{totalRecipients} total recipient(s) selected
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack}>
          ← Back
        </Button>
        <Button onClick={handleNext} disabled={isBuilding}>
          {isBuilding ? "Preparing audience..." : "Next →"}
        </Button>
      </div>
    </div>
  );
}
