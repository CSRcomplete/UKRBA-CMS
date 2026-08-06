"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { scheduleMeeting, type MeetingInvitee } from "@/actions/crm/meetings";
import moment from "moment";
import { Calendar, Video, Phone, Users, MapPin, Plus, X } from "lucide-react";

interface MeetingSchedulerFormProps {
  eligibleTargets: {
    users: any[];
    leads: any[];
  };
  onScheduled?: (zoomJoinUrl: string) => void;
}

interface AddedInvitee extends MeetingInvitee {
  label: string;
}

export function MeetingSchedulerForm({ eligibleTargets, onScheduled }: MeetingSchedulerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [meetingType, setMeetingType] = useState<"video" | "phone" | "in_person">("video");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(moment().add(1, "days").format("YYYY-MM-DDTHH:mm"));
  const [duration, setDuration] = useState("30");

  const [addedInvitees, setAddedInvitees] = useState<AddedInvitee[]>([]);
  const [inviteeType, setInviteeType] = useState<"user" | "lead" | "external">("lead");
  const [inviteeId, setInviteeId] = useState("");
  const [externalEmail, setExternalEmail] = useState("");
  const [externalName, setExternalName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const currentOptions = inviteeType === "user" ? eligibleTargets.users : eligibleTargets.leads;

  const filteredOptions = currentOptions.filter((opt) => {
    if (addedInvitees.some((a) => a.type === inviteeType && a.id === opt.id)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameStr = (opt.name || "").toLowerCase();
    const emailStr = (opt.email || "").toLowerCase();
    const companyStr = (opt.company || "").toLowerCase();
    return nameStr.includes(q) || emailStr.includes(q) || companyStr.includes(q);
  });

  const handleAddInvitee = () => {
    if (inviteeType === "external") {
      if (!externalEmail.trim()) {
        toast.error("Please enter an external email address");
        return;
      }
      if (addedInvitees.some((a) => a.type === "external" && a.externalEmail === externalEmail.trim())) {
        toast.error("That email has already been added");
        return;
      }
      setAddedInvitees((prev) => [
        ...prev,
        {
          type: "external",
          externalEmail: externalEmail.trim(),
          externalName: externalName.trim() || undefined,
          label: externalName.trim() ? `${externalName.trim()} (${externalEmail.trim()})` : externalEmail.trim(),
        },
      ]);
      setExternalEmail("");
      setExternalName("");
    } else {
      if (!inviteeId) {
        toast.error("Please select a person to add");
        return;
      }
      const opt = currentOptions.find((o) => o.id === inviteeId);
      if (!opt) return;
      setAddedInvitees((prev) => [
        ...prev,
        {
          type: inviteeType,
          id: inviteeId,
          label: `${opt.name || opt.email}${opt.company ? ` (${opt.company})` : ""}`,
        },
      ]);
      setInviteeId("");
      setSearchQuery("");
    }
  };

  const handleRemoveInvitee = (index: number) => {
    setAddedInvitees((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Meeting title is required");
      return;
    }
    if (addedInvitees.length === 0) {
      toast.error("Please add at least one invitee");
      return;
    }

    setLoading(true);
    try {
      const result = await scheduleMeeting({
        title,
        description,
        date: new Date(date),
        duration: duration ? parseInt(duration, 10) : undefined,
        invitees: addedInvitees.map(({ label, ...rest }) => rest),
        meetingType,
        location,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        const msg = meetingType === "video"
          ? "Meeting scheduled! Zoom meeting created automatically."
          : `${meetingType === "phone" ? "Phone call" : "Face-to-face meeting"} scheduled and invitation emails sent.`;
        toast.success(msg);
        setTitle("");
        setDescription("");
        setLocation("");
        setAddedInvitees([]);
        setInviteeId("");
        setExternalEmail("");
        setExternalName("");
        setSearchQuery("");
        if (onScheduled && result.zoomJoinUrl) {
          onScheduled(result.zoomJoinUrl);
        } else {
          router.refresh();
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Schedule New Meeting
        </CardTitle>
        <CardDescription>
          Schedule a Video Call, Phone Call, or Face-to-Face meeting with one or more staff members, leads, or external contacts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Meeting Title *</label>
              <Input
                placeholder="e.g. Q3 Strategy Review, Introduction Call"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Meeting Type *</label>
              <Select value={meetingType} onValueChange={(val: "video" | "phone" | "in_person") => setMeetingType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">
                    <span className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-blue-500" />
                      Video Meeting (Zoom)
                    </span>
                  </SelectItem>
                  <SelectItem value="phone">
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-emerald-500" />
                      Phone Call
                    </span>
                  </SelectItem>
                  <SelectItem value="in_person">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      Face-to-Face Meeting
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conditional location / phone number input */}
          {meetingType !== "video" && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {meetingType === "phone" ? "Phone Number / Contact Details" : "Meeting Location / Venue"}
              </label>
              <Input
                placeholder={meetingType === "phone" ? "e.g., +44 20 7946 0912 or Host will call invitee" : "e.g., HQ Office Room 3B, 100 Main St, London"}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          )}

          {/* Zoom meeting preview */}
          {meetingType === "video" && title.trim() && (
            <div className="flex items-start gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-lg text-xs text-blue-700 dark:text-blue-300">
              <Video className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-0.5">A Zoom meeting will be auto-created and the join link emailed to every invitee.</p>
              </div>
            </div>
          )}

          {/* Added invitees */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Invitees * ({addedInvitees.length} added)</label>
            {addedInvitees.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border bg-muted/30">
                {addedInvitees.map((inv, i) => (
                  <Badge key={i} variant="secondary" className="gap-1 pr-1 text-xs">
                    {inv.label}
                    <button
                      type="button"
                      onClick={() => handleRemoveInvitee(i)}
                      className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                      aria-label={`Remove ${inv.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Add Invitee</label>
              <Select
                value={inviteeType}
                onValueChange={(v: "user" | "lead" | "external") => {
                  setInviteeType(v);
                  setInviteeId("");
                  setExternalEmail("");
                  setExternalName("");
                  setSearchQuery("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">CRM Lead / Member</SelectItem>
                  <SelectItem value="user">Staff Member</SelectItem>
                  <SelectItem value="external">External Email Address (Unsaved Contact)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {inviteeType === "external" ? (
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">External Email Address</label>
                  <Input
                    type="email"
                    placeholder="e.g. client@externalcompany.com"
                    value={externalEmail}
                    onChange={(e) => setExternalEmail(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 items-end">
                  <div className="space-y-1 flex-1">
                    <label className="text-xs font-semibold text-muted-foreground">Contact Name (Optional)</label>
                    <Input
                      type="text"
                      placeholder="e.g. John Smith"
                      value={externalName}
                      onChange={(e) => setExternalName(e.target.value)}
                    />
                  </div>
                  <Button type="button" size="sm" className="gap-1" onClick={handleAddInvitee}>
                    <Plus className="h-3.5 w-3.5" /> Add
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Select Person</label>
                <div className="space-y-1.5">
                  <Input
                    placeholder="Search by name, email or company..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-xs mb-1"
                  />
                  <div className="flex gap-2">
                    <Select value={inviteeId} onValueChange={setInviteeId} disabled={filteredOptions.length === 0}>
                      <SelectTrigger className="h-9 text-xs flex-1">
                        <SelectValue placeholder={filteredOptions.length === 0 ? "No matching contacts found" : "Select person..."} />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {filteredOptions.map((opt) => (
                          <SelectItem key={opt.id} value={opt.id} className="text-xs">
                            {opt.name || opt.email} {opt.company ? `(${opt.company})` : ""} {opt.role ? `[${opt.role.replace(/_/g, " ")}]` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" size="sm" className="gap-1" onClick={handleAddInvitee} disabled={!inviteeId}>
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Date & Time *</label>
              <Input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Duration (minutes)</label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="45">45 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="90">90 minutes</SelectItem>
                  <SelectItem value="120">2 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Meeting Agenda / Notes</label>
            <Textarea
              placeholder="Provide meeting context or agenda items..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-2 gap-1.5"
            disabled={loading || addedInvitees.length === 0}
          >
            {meetingType === "video" && <Video className="h-4 w-4" />}
            {meetingType === "phone" && <Phone className="h-4 w-4" />}
            {meetingType === "in_person" && <Users className="h-4 w-4" />}
            {loading
              ? "Scheduling..."
              : meetingType === "video"
                ? "Schedule Video Meeting & Create Room"
                : meetingType === "phone"
                  ? "Schedule Phone Call & Send Invites"
                  : "Schedule Face-to-Face Meeting & Send Invites"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
