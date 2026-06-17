"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppRole, nextcrm_postcode_routing } from "@prisma/client";
import { toast } from "sonner";
import { ArrowLeft, Check, ChevronsUpDown, X, User, MapPin, Users as UsersIcon, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { updateUserManagement } from "@/actions/admin/users/update-user-management";

interface UserManageFormProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: AppRole;
    parentId: string | null;
    postcode_routing_assignments: { postcode_routing_id: string }[];
    children: { id: string }[];
  };
  postcodes: nextcrm_postcode_routing[];
  allUsers: { id: string; name: string | null; email: string; role: AppRole }[];
  channelPartners: { id: string; name: string | null; email: string }[];
}

export default function UserManageForm({
  user,
  postcodes,
  allUsers,
  channelPartners,
}: UserManageFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [role, setRole] = useState<AppRole>(user.role);
  const [parentId, setParentId] = useState<string>(user.parentId || "none");

  // Selected postcode routing area IDs
  const [selectedPostcodeIds, setSelectedPostcodeIds] = useState<string[]>(
    user.postcode_routing_assignments.map((a) => a.postcode_routing_id)
  );

  // Selected Channel Partner IDs (whose parentId is this user)
  // Initially, channel partners whose parentId matches user.id
  const [selectedCPIds, setSelectedCPIds] = useState<string[]>(
    channelPartners.filter((cp) => user.children.some((c) => c.id === cp.id)).map((cp) => cp.id)
  );

  // Combobox/Popover open states
  const [pcOpen, setPcOpen] = useState(false);
  const [cpOpen, setCpOpen] = useState(false);

  // Search states for comboboxes
  const [pcSearch, setPcSearch] = useState("");
  const [cpSearch, setCpSearch] = useState("");

  // Filter supervisors to prevent self-selection
  const supervisorOptions = allUsers.filter((u) => u.id !== user.id);

  const handleSave = () => {
    startTransition(async () => {
      const parentVal = parentId === "none" ? null : parentId;
      const res = await updateUserManagement(user.id, {
        role,
        parentId: parentVal,
        postcodeAreaIds: selectedPostcodeIds,
        channelPartnerIds: selectedCPIds,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("User management settings saved successfully");
        router.refresh();
      }
    });
  };

  // Helper to get postcode name from ID
  const getPostcodeLabel = (id: string) => {
    const pc = postcodes.find((p) => p.id === id);
    return pc ? `${pc.postcode_area} - ${pc.area_name || "Unknown Area"}` : id;
  };

  // Helper to get CP name from ID
  const getCPLabel = (id: string) => {
    const cp = channelPartners.find((c) => c.id === id);
    return cp ? `${cp.name || cp.email}` : id;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Manage Staff Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure role, reporting supervisor, and assignments for {user.name || user.email}.
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Core Hierarchy Settings Card */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Role & Hierarchy
            </CardTitle>
            <CardDescription>
              Define the user's operational role and direct manager/supervisor.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Role selection */}
            <div className="space-y-2">
              <Label htmlFor="role">User Role</Label>
              <Select value={role} onValueChange={(val) => setRole(val as AppRole)}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="ceo">CEO</SelectItem>
                  <SelectItem value="operations_director">Operations Director</SelectItem>
                  <SelectItem value="regional_director">Regional Director</SelectItem>
                  <SelectItem value="area_director">Area Director</SelectItem>
                  <SelectItem value="channel_partner">Channel Partner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Supervisor parentId selection */}
            <div className="space-y-2">
              <Label htmlFor="supervisor">Supervisor (Manager Above)</Label>
              <Select value={parentId} onValueChange={setParentId}>
                <SelectTrigger id="supervisor">
                  <SelectValue placeholder="Select manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Independent / Top Level)</SelectItem>
                  {supervisorOptions.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Visual Hierarchy Diagram / Info */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Hierarchy Context
            </CardTitle>
            <CardDescription>
              Quick reference of role mappings and responsibilities.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <div className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Standard Reporting Tree:</div>
              <div className="flex flex-col gap-1">
                <span className="font-medium text-amber-500">CEO / Admin / Operations Director</span>
                <span className="text-muted-foreground ml-4">↳ Regional Director (Manages Regions)</span>
                <span className="text-muted-foreground ml-8">↳ Area Director (Manages Postcodes)</span>
                <span className="text-muted-foreground ml-12">↳ Channel Partner (Receives Local Leads)</span>
              </div>
            </div>
            <div className="text-xs text-muted-foreground leading-relaxed">
              * Lead round-robin routing will automatically distribute Wix leads to Area Directors assigned to the lead's postcode, who will then share leads with their mapped Channel Partners.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Area Director Specific Section */}
      {role === "area_director" && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-emerald-500" />
              Assigned Postcode Areas
            </CardTitle>
            <CardDescription>
              Specify which postcode areas this Area Director covers. Incoming leads in these areas will be routed to them.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Postcodes</Label>
              <div className="flex flex-col gap-3">
                <Popover open={pcOpen} onOpenChange={setPcOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={pcOpen}
                      className="w-full justify-between"
                    >
                      Search & add postcode area...
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full max-w-md p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search postcode area (e.g. AB, SW)..."
                        value={pcSearch}
                        onValueChange={setPcSearch}
                      />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>No postcode areas found.</CommandEmpty>
                        <CommandGroup>
                          {postcodes.map((pc) => {
                            const isSelected = selectedPostcodeIds.includes(pc.id);
                            return (
                              <CommandItem
                                key={pc.id}
                                value={`${pc.postcode_area} ${pc.area_name || ""}`}
                                onSelect={() => {
                                  if (isSelected) {
                                    setSelectedPostcodeIds((prev) => prev.filter((id) => id !== pc.id));
                                  } else {
                                    setSelectedPostcodeIds((prev) => [...prev, pc.id]);
                                  }
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span className="font-bold mr-2">{pc.postcode_area}</span>
                                <span className="text-muted-foreground text-sm">{pc.area_name}</span>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Display Selected Areas as Tags */}
                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-md border bg-muted/30">
                  {selectedPostcodeIds.length === 0 ? (
                    <span className="text-sm text-muted-foreground p-1">No postcode areas assigned yet.</span>
                  ) : (
                    selectedPostcodeIds.map((id) => (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="flex items-center gap-1.5 py-1.5 px-3 text-sm bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400"
                      >
                        {getPostcodeLabel(id)}
                        <button
                          type="button"
                          className="rounded-full outline-none hover:bg-emerald-200/50 p-0.5"
                          onClick={() => setSelectedPostcodeIds((prev) => prev.filter((item) => item !== id))}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Area Director - Channel Partner Assignment */}
      {role === "area_director" && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UsersIcon className="h-5 w-5 text-indigo-500" />
              Assigned Channel Partners
            </CardTitle>
            <CardDescription>
              Select Channel Partners who report directly to this Area Director.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Channel Partners</Label>
              <div className="flex flex-col gap-3">
                <Popover open={cpOpen} onOpenChange={setCpOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={cpOpen}
                      className="w-full justify-between"
                    >
                      Search & add channel partner...
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full max-w-md p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search channel partners..."
                        value={cpSearch}
                        onValueChange={setCpSearch}
                      />
                      <CommandList className="max-h-[300px]">
                        <CommandEmpty>No channel partners found.</CommandEmpty>
                        <CommandGroup>
                          {channelPartners.map((cp) => {
                            const isSelected = selectedCPIds.includes(cp.id);
                            return (
                              <CommandItem
                                key={cp.id}
                                value={cp.name || cp.email}
                                onSelect={() => {
                                  if (isSelected) {
                                    setSelectedCPIds((prev) => prev.filter((id) => id !== cp.id));
                                  } else {
                                    setSelectedCPIds((prev) => [...prev, cp.id]);
                                  }
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {cp.name || cp.email}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {/* Display Selected CP as Tags */}
                <div className="flex flex-wrap gap-2 min-h-[40px] p-2 rounded-md border bg-muted/30">
                  {selectedCPIds.length === 0 ? (
                    <span className="text-sm text-muted-foreground p-1">No channel partners assigned yet.</span>
                  ) : (
                    selectedCPIds.map((id) => (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="flex items-center gap-1.5 py-1.5 px-3 text-sm bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400"
                      >
                        {getCPLabel(id)}
                        <button
                          type="button"
                          className="rounded-full outline-none hover:bg-indigo-200/50 p-0.5"
                          onClick={() => setSelectedCPIds((prev) => prev.filter((item) => item !== id))}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
