"use client";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { createTargetListFromLeads } from "@/actions/crm/leads/create-target-list-from-leads";
import { MapPin, Users, X } from "lucide-react";

type TargetList = {
  id: string;
  name: string;
  _count: { targets: number };
};

type PostcodeOption = { postcode_area: string; area_name: string | null };

type AudienceLead = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  postcode: string | null;
  postcodeArea: string;
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
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isBuilding, setIsBuilding] = useState(false);

  // Only show postcode chips that actually have at least one emailable lead
  const postcodesWithLeads = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lead of leads) {
      if (!lead.postcodeArea) continue;
      counts.set(lead.postcodeArea, (counts.get(lead.postcodeArea) ?? 0) + 1);
    }
    return postcodeOptions
      .filter((p) => counts.has(p.postcode_area))
      .map((p) => ({ ...p, count: counts.get(p.postcode_area)! }));
  }, [postcodeOptions, leads]);

  const leadsByPostcode = useMemo(() => {
    const map = new Map<string, AudienceLead[]>();
    for (const lead of leads) {
      if (!lead.postcodeArea) continue;
      if (!map.has(lead.postcodeArea)) map.set(lead.postcodeArea, []);
      map.get(lead.postcodeArea)!.push(lead);
    }
    return map;
  }, [leads]);

  const isPostcodeFullySelected = (area: string) => {
    const group = leadsByPostcode.get(area) ?? [];
    return group.length > 0 && group.every((l) => selectedLeadIds.has(l.id));
  };

  const togglePostcode = (area: string) => {
    const group = leadsByPostcode.get(area) ?? [];
    const fullySelected = isPostcodeFullySelected(area);
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      for (const lead of group) {
        if (fullySelected) next.delete(lead.id);
        else next.add(lead.id);
      }
      return next;
    });
  };

  const toggleLead = (id: string) => {
    setSelectedLeadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSavedList = (id: string) => {
    setSavedListIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredLeads = leads.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.email.toLowerCase().includes(q) ||
      (l.company ?? "").toLowerCase().includes(q) ||
      (l.postcode ?? "").toLowerCase().includes(q)
    );
  });

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
      const selectedAreas = postcodesWithLeads
        .filter((p) => isPostcodeFullySelected(p.postcode_area))
        .map((p) => p.postcode_area);
      const label = selectedAreas.length > 0
        ? `Campaign audience — ${selectedAreas.join(", ")} (${selectedLeadIds.size} leads) — ${new Date().toLocaleDateString("en-GB")}`
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
      {/* Postcode quick-select */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <MapPin className="h-4 w-4" /> Select by postcode (one click = everyone in that area)
        </label>
        {postcodesWithLeads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No leads with a postcode and email address yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {postcodesWithLeads.map((p) => {
              const active = isPostcodeFullySelected(p.postcode_area);
              return (
                <button
                  key={p.postcode_area}
                  type="button"
                  onClick={() => togglePostcode(p.postcode_area)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-input"
                  }`}
                >
                  {p.postcode_area}
                  {p.area_name ? ` — ${p.area_name}` : ""} ({p.count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Individual leads */}
      <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1.5">
          <Users className="h-4 w-4" /> Or pick individual leads (any region)
        </label>
        <Input
          placeholder="Search by name, email, company or postcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
          {filteredLeads.length === 0 ? (
            <p className="text-sm text-muted-foreground p-3">No leads found.</p>
          ) : (
            filteredLeads.map((lead) => (
              <label
                key={lead.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-muted cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedLeadIds.has(lead.id)}
                  onChange={() => toggleLead(lead.id)}
                />
                <span className="font-medium">{lead.name}</span>
                <span className="text-muted-foreground truncate">{lead.email}</span>
                {lead.postcode && (
                  <Badge variant="outline" className="ml-auto text-[10px] shrink-0">
                    {lead.postcode}
                  </Badge>
                )}
              </label>
            ))
          )}
        </div>
        {selectedLeadIds.size > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{selectedLeadIds.size} lead(s) selected</span>
            <button
              type="button"
              className="flex items-center gap-1 hover:text-foreground"
              onClick={() => setSelectedLeadIds(new Set())}
            >
              <X className="h-3 w-3" /> Clear
            </button>
          </div>
        )}
      </div>

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
