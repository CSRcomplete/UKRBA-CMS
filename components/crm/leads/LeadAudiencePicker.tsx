"use client";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, X } from "lucide-react";

export type PostcodeOption = { postcode_area: string; area_name: string | null };

export type AudienceLead = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  postcode: string | null;
  postcodeArea: string;
};

interface LeadAudiencePickerProps {
  postcodeOptions: PostcodeOption[];
  leads: AudienceLead[];
  selectedLeadIds: Set<string>;
  onChange: (next: Set<string>) => void;
}

/**
 * Shared audience picker: one-click select every lead in a postcode area,
 * plus a searchable checklist to hand-pick individual leads regardless of
 * region. Used by both the Campaign wizard's Audience step and the
 * "Create Target List" modal so the two stay in sync.
 */
export function LeadAudiencePicker({
  postcodeOptions,
  leads,
  selectedLeadIds,
  onChange,
}: LeadAudiencePickerProps) {
  const [search, setSearch] = useState("");

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
    const next = new Set(selectedLeadIds);
    for (const lead of group) {
      if (fullySelected) next.delete(lead.id);
      else next.add(lead.id);
    }
    onChange(next);
  };

  const toggleLead = (id: string) => {
    const next = new Set(selectedLeadIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
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

  return (
    <div className="flex flex-col gap-4">
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
              onClick={() => onChange(new Set())}
            >
              <X className="h-3 w-3" /> Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
