"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AppRole, nextcrm_postcode_routing } from "@prisma/client";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ChevronsUpDown,
  X,
  User,
  MapPin,
  Users as UsersIcon,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  Mail,
  Plus,
  Trash2,
  Camera,
  KeyRound,
} from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { updateUserManagement } from "@/actions/admin/users/update-user-management";
import { adminUpdateUserProfile } from "@/actions/admin/users/admin-update-user-profile";
import {
  createEmailAccountAdmin,
  deleteEmailAccountAdmin,
  toggleEmailAccountActiveAdmin,
} from "@/actions/admin/users/admin-manage-user-email-accounts";

interface UserManageFormProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar?: string | null;
    image?: string | null;
    role: AppRole;
    parentId: string | null;
    postcode_routing_assignments: { postcode_routing_id: string }[];
    children: { id: string }[];
  };
  postcodes: nextcrm_postcode_routing[];
  allUsers: { id: string; name: string | null; email: string; role: AppRole }[];
  channelPartners: { id: string; name: string | null; email: string }[];
  emailAccounts?: any[];
  currentUserRole?: string;
}

export default function UserManageForm({
  user,
  postcodes,
  allUsers,
  channelPartners,
  emailAccounts = [],
  currentUserRole = "user",
}: UserManageFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isCeoOrAdmin =
    currentUserRole.toLowerCase() === "admin" || currentUserRole.toLowerCase() === "ceo";

  // Core Hierarchy & Role states
  const [role, setRole] = useState<AppRole>(user.role);
  const [parentId, setParentId] = useState<string>(user.parentId || "none");

  // User Profile & Credential states
  const [name, setName] = useState<string>(user.name || "");
  const [avatar, setAvatar] = useState<string>(user.avatar || user.image || "");
  const [newPassword, setNewPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  // Email Accounts state
  const [accounts, setAccounts] = useState<any[]>(emailAccounts);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [addingEmail, setAddingEmail] = useState<boolean>(false);

  const [emailForm, setEmailForm] = useState({
    label: "",
    imapHost: "imap.gmail.com",
    imapPort: 993,
    imapSsl: true,
    smtpHost: "smtp.gmail.com",
    smtpPort: 465,
    smtpSsl: true,
    username: user.email,
    password: "",
  });

  // Selected postcode routing area IDs
  const [selectedPostcodeIds, setSelectedPostcodeIds] = useState<string[]>(
    user.postcode_routing_assignments.map((a) => a.postcode_routing_id)
  );

  // Selected Channel Partner IDs (whose parentId is this user)
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

  const handleSaveHierarchy = () => {
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
        toast.success("Role and hierarchy settings saved successfully");
        router.refresh();
      }
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCeoOrAdmin) {
      toast.error("Only CEO and Admin can update user profiles and passwords.");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await adminUpdateUserProfile(user.id, {
        name,
        avatar,
        password: newPassword || undefined,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("User profile and credentials updated successfully!");
        setNewPassword("");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update user profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateEmailAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCeoOrAdmin) {
      toast.error("Only CEO and Admin can link email accounts.");
      return;
    }

    setAddingEmail(true);
    try {
      const res = await createEmailAccountAdmin({
        targetUserId: user.id,
        ...emailForm,
      });

      if (res.success) {
        toast.success("Email account linked successfully!");
        setIsEmailModalOpen(false);
        setEmailForm({
          label: "",
          imapHost: "imap.gmail.com",
          imapPort: 993,
          imapSsl: true,
          smtpHost: "smtp.gmail.com",
          smtpPort: 465,
          smtpSsl: true,
          username: user.email,
          password: "",
        });
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to link email account");
    } finally {
      setAddingEmail(false);
    }
  };

  const handleToggleAccountActive = async (accId: string, currentStatus: boolean) => {
    try {
      await toggleEmailAccountActiveAdmin(user.id, accId, !currentStatus);
      setAccounts((prev) =>
        prev.map((a) => (a.id === accId ? { ...a, isActive: !currentStatus } : a))
      );
      toast.success(`Account ${!currentStatus ? "activated" : "deactivated"}.`);
    } catch (err: any) {
      toast.error("Failed to update status: " + err.message);
    }
  };

  const handleDeleteAccount = async (accId: string) => {
    if (!confirm("Are you sure you want to unlink this email account?")) return;
    try {
      await deleteEmailAccountAdmin(user.id, accId);
      setAccounts((prev) => prev.filter((a) => a.id !== accId));
      toast.success("Email account unlinked.");
    } catch (err: any) {
      toast.error("Failed to delete account: " + err.message);
    }
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
    <div className="space-y-6 max-w-5xl mx-auto p-4">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/users">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border">
              <AvatarImage src={avatar || undefined} />
              <AvatarFallback className="font-semibold bg-primary/10 text-primary">
                {(name || user.email).charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Manage {name || user.email}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
        <Button onClick={handleSaveHierarchy} disabled={isPending}>
          {isPending ? "Saving..." : "Save Hierarchy Settings"}
        </Button>
      </div>

      <Separator />

      {/* CEO & Admin Full Profile & Credential Controls Card */}
      {isCeoOrAdmin ? (
        <Card className="shadow-sm border-primary/20 bg-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg text-primary">
              <KeyRound className="h-5 w-5" />
              Full Profile & Security Control (Admin & CEO Only)
            </CardTitle>
            <CardDescription>
              Directly edit this user's name, profile picture URL, or set a new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="userName" className="text-xs font-semibold">
                    Full Name
                  </Label>
                  <Input
                    id="userName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. John Smith"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="userAvatar" className="text-xs font-semibold flex items-center gap-1">
                    <Camera className="h-3.5 w-3.5" /> Profile Picture URL
                  </Label>
                  <Input
                    id="userAvatar"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs font-semibold flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5 text-amber-500" /> Reset Password (Optional)
                </Label>
                <div className="relative max-w-md">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 chars)..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Leave empty if you do not wish to reset the user's password.
                </p>
              </div>

              <Button type="submit" disabled={savingProfile} size="sm" className="gap-1.5 bg-primary">
                <Check className="h-4 w-4" />
                {savingProfile ? "Saving Profile..." : "Update Profile & Credentials"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 flex-shrink-0" />
          <span>Security Restriction: Only CEO and Admin users can edit credentials or profile pictures.</span>
        </div>
      )}

      {/* Linked Email Accounts (IMAP/SMTP) Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mail className="h-5 w-5 text-indigo-500" />
              Linked Email Accounts (IMAP / SMTP)
            </CardTitle>
            <CardDescription>
              Connect external mailboxes to allow this user to send/receive emails from the CRM.
            </CardDescription>
          </div>
          {isCeoOrAdmin && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 border-indigo-200 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              onClick={() => setIsEmailModalOpen(true)}
            >
              <Plus className="h-4 w-4" /> Link Email Account
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed rounded-lg text-xs text-muted-foreground space-y-1">
              <p>No email accounts linked to this user yet.</p>
              {isCeoOrAdmin && (
                <p className="text-indigo-600 font-medium cursor-pointer" onClick={() => setIsEmailModalOpen(true)}>
                  + Click to link an IMAP/SMTP account
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{acc.label}</span>
                      <Badge variant={acc.isActive ? "default" : "secondary"} className="text-[10px]">
                        {acc.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{acc.username}</p>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                      <span>IMAP: {acc.imapHost}:{acc.imapPort}</span>
                      <span>SMTP: {acc.smtpHost}:{acc.smtpPort}</span>
                    </div>
                  </div>

                  {isCeoOrAdmin && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 text-xs"
                        onClick={() => handleToggleAccountActive(acc.id, acc.isActive)}
                      >
                        {acc.isActive ? "Disable" : "Enable"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                        onClick={() => handleDeleteAccount(acc.id)}
                        title="Unlink Email Account"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Email Account Modal Dialog */}
      <Dialog open={isEmailModalOpen} onOpenChange={setIsEmailModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-indigo-600" />
              Link Email Account for {user.name || user.email}
            </DialogTitle>
            <DialogDescription>
              Configure IMAP and SMTP mail server settings to connect an email account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEmailAccount} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label className="text-xs">Account Label *</Label>
              <Input
                placeholder="e.g. Work Email, Sales Inbox"
                value={emailForm.label}
                onChange={(e) => setEmailForm({ ...emailForm, label: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">IMAP Host *</Label>
                <Input
                  value={emailForm.imapHost}
                  onChange={(e) => setEmailForm({ ...emailForm, imapHost: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">IMAP Port *</Label>
                <Input
                  type="number"
                  value={emailForm.imapPort}
                  onChange={(e) => setEmailForm({ ...emailForm, imapPort: parseInt(e.target.value, 10) })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">SMTP Host *</Label>
                <Input
                  value={emailForm.smtpHost}
                  onChange={(e) => setEmailForm({ ...emailForm, smtpHost: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">SMTP Port *</Label>
                <Input
                  type="number"
                  value={emailForm.smtpPort}
                  onChange={(e) => setEmailForm({ ...emailForm, smtpPort: parseInt(e.target.value, 10) })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Email / Username *</Label>
              <Input
                value={emailForm.username}
                onChange={(e) => setEmailForm({ ...emailForm, username: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Password / App Password *</Label>
              <Input
                type="password"
                value={emailForm.password}
                onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEmailModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addingEmail}>
                {addingEmail ? "Linking..." : "Link Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2">
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

      {(role === "regional_director" || role === "area_director" || role === "channel_partner") && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-emerald-500" />
              Assigned Postcode Areas
            </CardTitle>
            <CardDescription>
              Specify which postcode areas this staff member covers. Incoming leads in these areas will be routed to them.
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
                                {pc.postcode_area} - {pc.area_name || "Unknown"}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

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

      {(role === "area_director" || role === "operations_director" || role === "regional_director") && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UsersIcon className="h-5 w-5 text-indigo-500" />
              Channel Partners Under Management
            </CardTitle>
            <CardDescription>
              Assign channel partners who report to this director.
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
                        placeholder="Search channel partner..."
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
                                value={`${cp.name || ""} ${cp.email}`}
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
