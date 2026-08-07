"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTargetList } from "@/actions/crm/target-lists/create-target-list";
import { createTargetListFromLeads } from "@/actions/crm/leads/create-target-list-from-leads";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LeadAudiencePicker, type PostcodeOption, type AudienceLead } from "@/components/crm/leads/LeadAudiencePicker";

interface CreateTargetListModalProps {
  postcodeOptions?: PostcodeOption[];
  leads?: AudienceLead[];
}

const CreateTargetListModal = ({ postcodeOptions = [], leads = [] }: CreateTargetListModalProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());

  const reset = () => {
    setName("");
    setDescription("");
    setSelectedLeadIds(new Set());
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Name is required.");
      return;
    }

    setIsLoading(true);
    const result = selectedLeadIds.size > 0
      ? await createTargetListFromLeads(Array.from(selectedLeadIds), name, description)
      : await createTargetList({ name, description });
    setIsLoading(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    const skipped = "skippedNoEmail" in result && result.skippedNoEmail ? ` (${result.skippedNoEmail} skipped — no email address)` : "";
    toast.success(`Target list created successfully${skipped}`);
    setOpen(false);
    reset();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm">+ New List</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Target List</DialogTitle>
          <DialogDescription>
            Create a new list to group your targets for campaigns or outreach — optionally by pulling
            leads straight from the CRM, by postcode or individually.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Q1 Outreach List"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="A list of targets for Q1 outreach campaign"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {leads.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <Label>Add CRM leads to this list (optional)</Label>
              <LeadAudiencePicker
                postcodeOptions={postcodeOptions}
                leads={leads}
                selectedLeadIds={selectedLeadIds}
                onChange={setSelectedLeadIds}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isLoading || !name.trim()}>
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTargetListModal;
