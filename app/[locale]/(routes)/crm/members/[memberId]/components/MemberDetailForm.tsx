"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateMember } from "@/actions/crm/members";
import { UserSearchCombobox } from "@/components/ui/user-search-combobox";
import { Badge } from "@/components/ui/badge";
import { Building, Mail, Phone, Calendar, Shield, Award, Users } from "lucide-react";
import moment from "moment";

interface MemberDetailFormProps {
  member: any;
}

const LIFECYCLE_STATUSES = [
  "Enquiry",
  "Lead",
  "Assessment",
  "Appointment",
  "Proposal",
  "Membership",
  "Onboarding",
  "Renewal",
  "Retention"
];

export function MemberDetailForm({ member }: MemberDetailFormProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [businessName, setBusinessName] = useState(member.business_name);
  const [contactName, setContactName] = useState(member.contact_name);
  const [telephone, setTelephone] = useState(member.telephone);
  const [email, setEmail] = useState(member.email);
  const [lifecycleStatus, setLifecycleStatus] = useState(member.lifecycle_status);
  const [channelPartnerId, setChannelPartnerId] = useState(member.assigned_channel_partner_id || "");
  const [areaDirectorId, setAreaDirectorId] = useState(member.assigned_area_director_id || "");
  const [regionalDirectorId, setRegionalDirectorId] = useState(member.assigned_regional_director_id || "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateMember({
        id: member.id,
        business_name: businessName,
        contact_name: contactName,
        telephone,
        email,
        lifecycle_status: lifecycleStatus,
        assigned_channel_partner_id: channelPartnerId || null,
        assigned_area_director_id: areaDirectorId || null,
        assigned_regional_director_id: regionalDirectorId || null,
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Member updated successfully");
        setIsEditing(false);
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update member");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Membership":
        return <Badge className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1">Membership</Badge>;
      case "Onboarding":
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1">Onboarding</Badge>;
      case "Renewal":
        return <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white text-sm px-3 py-1">Renewal</Badge>;
      case "Retention":
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1">Retention</Badge>;
      default:
        return <Badge variant="outline" className="text-sm px-3 py-1">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Detail Card */}
      <Card className="shadow-sm border-muted">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-xl">Member Profile</CardTitle>
            <CardDescription>
              General information, lifecycle path, and assigned responsible owners.
            </CardDescription>
          </div>
          <Button
            variant={isEditing ? "ghost" : "outline"}
            onClick={() => setIsEditing(!isEditing)}
            type="button"
          >
            {isEditing ? "Cancel" : "Edit Details"}
          </Button>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Contact Name</label>
                  <Input value={contactName} onChange={(e) => setContactName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Business Name</label>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Email</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Telephone</label>
                  <Input value={telephone} onChange={(e) => setTelephone(e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Lifecycle Status</label>
                  <Select value={lifecycleStatus} onValueChange={setLifecycleStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LIFECYCLE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Assigned Channel Partner</label>
                  <UserSearchCombobox value={channelPartnerId} onChange={setChannelPartnerId} placeholder="Search Channel Partner..." />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Assigned Area Director</label>
                  <UserSearchCombobox value={areaDirectorId} onChange={setAreaDirectorId} placeholder="Search Area Director..." />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Assigned Regional Director</label>
                  <UserSearchCombobox value={regionalDirectorId} onChange={setRegionalDirectorId} placeholder="Search Regional Director..." />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Business Name</p>
                    <p className="font-semibold text-sm">{member.business_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Email Address</p>
                    <p className="text-sm">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Telephone</p>
                    <p className="text-sm">{member.telephone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Converted Date</p>
                    <p className="text-sm">{moment(member.createdAt).format("MMMM DD, YYYY")}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Lifecycle Status</p>
                  {getStatusBadge(member.lifecycle_status)}
                </div>

                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Responsible Owners</p>

                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-primary" />
                    <span>Channel Partner: </span>
                    <span className="font-semibold">{member.lead?.assigned_to_user?.name || "None"}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-emerald-600" />
                    <span>Area Director: </span>
                    <span className="font-semibold">
                      {member.assigned_area_director_id ? "Assigned" : "None"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Award className="h-4 w-4 text-orange-600" />
                    <span>Regional Director: </span>
                    <span className="font-semibold">
                      {member.assigned_regional_director_id ? "Assigned" : "None"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
