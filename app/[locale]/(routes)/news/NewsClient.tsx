"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Megaphone,
  Plus,
  Search,
  Pin,
  Paperclip,
  Download,
  Trash2,
  Edit,
  User,
  Calendar,
  Building,
  Radio,
  FileText,
  ShieldCheck,
  Code,
  Users,
  X,
  UserCheck,
  Lock,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAnnouncementsAsRead,
  type AnnouncementItem,
} from "@/actions/news/news";
import { searchUsers } from "@/actions/user/search-users";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

const CATEGORIES = [
  "All",
  "Company News",
  "Marketing Campaigns",
  "Operational Updates",
  "Software Updates",
  "New Resources",
  "Compliance Notices",
  "Staff Announcements",
];

interface SimpleUser {
  id: string;
  name: string | null;
  email: string | null;
  role?: string | null;
}

export function NewsClient() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Target audience users state
  const [availableUsers, setAvailableUsers] = useState<SimpleUser[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Company News");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [targetGroup, setTargetGroup] = useState<string>("ALL");
  const [targetUserIds, setTargetUserIds] = useState<string[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [existingAttachmentName, setExistingAttachmentName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAnnouncements(selectedCategory);
      setAnnouncements(res.announcements);
      setIsAdmin(res.isAdmin);
      await markAnnouncementsAsRead();
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersList = async () => {
    try {
      const res = await searchUsers({ take: 100 });
      setAvailableUsers(res.users as any);
    } catch (err) {
      console.error("Failed to fetch users for targeting", err);
    }
  };

  const openPublishModal = () => {
    setEditingId(null);
    setTitle("");
    setCategory("Company News");
    setContent("");
    setIsPinned(false);
    setTargetGroup("ALL");
    setTargetUserIds([]);
    setAttachedFile(null);
    setExistingAttachmentName(null);
    setError(null);
    setIsModalOpen(true);
    fetchUsersList();
  };

  const openEditModal = (item: AnnouncementItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setContent(item.content);
    setIsPinned(item.isPinned);
    setTargetGroup(item.targetGroup || "ALL");
    setTargetUserIds(item.targetUserIds || []);
    setAttachedFile(null);
    setExistingAttachmentName(item.attachmentName || null);
    setError(null);
    setIsModalOpen(true);
    fetchUsersList();
  };

  const handleToggleUserTarget = (userId: string) => {
    setTargetUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Please provide a title and content for the announcement.");
      return;
    }

    if (targetGroup === "SPECIFIC" && targetUserIds.length === 0) {
      setError("Please select at least one specific user to target.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      let attachmentPayload = undefined;

      if (attachedFile) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const res = reader.result as string;
            resolve(res.split(",")[1] || "");
          };
          reader.onerror = reject;
          reader.readAsDataURL(attachedFile);
        });

        attachmentPayload = {
          name: attachedFile.name,
          content: base64,
          contentType: attachedFile.type || "application/octet-stream",
          size: attachedFile.size,
        };
      }

      if (editingId) {
        await updateAnnouncement(editingId, {
          title,
          category,
          content,
          isPinned,
          targetGroup,
          targetUserIds,
          attachment: attachmentPayload,
        });
      } else {
        await createAnnouncement({
          title,
          category,
          content,
          isPinned,
          targetGroup,
          targetUserIds,
          attachment: attachmentPayload,
        });
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;
    try {
      await deleteAnnouncement(id);
      fetchData();
    } catch {
      // Error
    }
  };

  const filteredAnnouncements = announcements.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.authorName.toLowerCase().includes(q)
    );
  });

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "Company News":
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white"><Building className="h-3 w-3 mr-1" /> Company News</Badge>;
      case "Marketing Campaigns":
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white"><Radio className="h-3 w-3 mr-1" /> Marketing</Badge>;
      case "Operational Updates":
        return <Badge className="bg-amber-600 hover:bg-amber-700 text-white"><FileText className="h-3 w-3 mr-1" /> Operations</Badge>;
      case "Software Updates":
        return <Badge className="bg-cyan-600 hover:bg-cyan-700 text-white"><Code className="h-3 w-3 mr-1" /> Software</Badge>;
      case "New Resources":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white"><FileText className="h-3 w-3 mr-1" /> Resources</Badge>;
      case "Compliance Notices":
        return <Badge className="bg-rose-600 hover:bg-rose-700 text-white"><ShieldCheck className="h-3 w-3 mr-1" /> Compliance</Badge>;
      default:
        return <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white"><Users className="h-3 w-3 mr-1" /> Staff News</Badge>;
    }
  };

  const getTargetAudienceBadge = (tg?: string | null, userIds?: string[]) => {
    switch (tg) {
      case "ALL_REGIONAL_DIRECTORS":
        return <Badge variant="outline" className="border-violet-300 text-violet-700 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300">👔 All Regional Directors</Badge>;
      case "ALL_AREA_DIRECTORS":
        return <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300">🏢 All Area Managers</Badge>;
      case "ALL_CHANNEL_PARTNERS":
        return <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300">🤝 All Channel Partners</Badge>;
      case "SPECIFIC":
        return <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300">👤 Targeted to {userIds?.length || 0} User(s)</Badge>;
      default:
        return <Badge variant="outline" className="border-slate-300 text-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-slate-300">👥 All Staff</Badge>;
    }
  };

  const filteredUsersForTarget = availableUsers.filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-violet-600" />
            <h1 className="text-2xl font-bold tracking-tight">News & Announcements Noticeboard</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Internal company noticeboard for official UKRBA updates, compliance, targeted notices, and staff news.
          </p>
        </div>

        {isAdmin && (
          <Button onClick={openPublishModal} className="bg-violet-600 hover:bg-violet-700 text-white shadow-md">
            <Plus className="h-4 w-4 mr-2" />
            Publish Announcement
          </Button>
        )}
      </div>

      {/* Category Pills & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={
                selectedCategory === cat
                  ? "bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-full text-xs"
                  : "rounded-full text-xs"
              }
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs rounded-lg"
          />
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading noticeboard announcements...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center bg-card">
          <Megaphone className="h-12 w-12 text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-semibold">No announcements found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            There are no targeted or general announcements matching your current category or search criteria.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((item) => (
            <Card
              key={item.id}
              className={`overflow-hidden transition-all hover:shadow-md ${
                item.isPinned ? "border-2 border-violet-500/80 bg-violet-500/5" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.isPinned && (
                        <Badge className="bg-amber-500 text-white hover:bg-amber-600 flex items-center gap-1">
                          <Pin className="h-3 w-3 fill-white" /> Pinned Notice
                        </Badge>
                      )}
                      {getCategoryBadge(item.category)}
                      {getTargetAudienceBadge(item.targetGroup, item.targetUserIds)}
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground leading-snug">
                      {item.title}
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-medium">
                        <User className="h-3.5 w-3.5 text-violet-600" />
                        {item.authorName}{" "}
                        <span className="text-[10px] text-muted-foreground/70">({item.authorRole})</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {format(parseISO(item.createdAt), "MMM d, yyyy, h:mm:ss a")}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(item)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        className="h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pb-4">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-foreground"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              </CardContent>

              {item.attachmentUrl && (
                <CardFooter className="px-5 py-3 bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <Paperclip className="h-4 w-4 text-violet-600" />
                    <span>{item.attachmentName || "Attached Document"}</span>
                    {item.attachmentSize && (
                      <span className="text-[10px] text-muted-foreground">
                        ({Math.round(item.attachmentSize / 1024)} KB)
                      </span>
                    )}
                  </div>

                  <a
                    href={item.attachmentUrl}
                    download={item.attachmentName || "attachment"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:underline"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download File
                  </a>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Publish / Edit Modal (Admin Only) */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Announcement" : "Publish Official Announcement"}
            </DialogTitle>
          </DialogHeader>

          {error && <p className="text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</p>}

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1">
              <Label>Announcement Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Compliance Guidelines & Regional Updates"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Category *</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-sm"
                >
                  {CATEGORIES.filter((c) => c !== "All").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Label htmlFor="pinned" className="cursor-pointer font-medium">
                  Pin to Top of Noticeboard
                </Label>
                <Switch id="pinned" checked={isPinned} onCheckedChange={setIsPinned} />
              </div>
            </div>

            {/* Target Audience Hierarchy & Specific Users */}
            <div className="space-y-2 p-3 rounded-lg border border-violet-200 dark:border-violet-900/50 bg-violet-50/40 dark:bg-violet-950/20">
              <div className="space-y-1">
                <Label className="font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Target Audience Visibility *
                </Label>
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus:ring-violet-500"
                >
                  <option value="ALL">👥 All Staff (Everyone)</option>
                  <option value="ALL_REGIONAL_DIRECTORS">👔 All Regional Directors</option>
                  <option value="ALL_AREA_DIRECTORS">🏢 All Area Managers</option>
                  <option value="ALL_CHANNEL_PARTNERS">🤝 All Channel Partners</option>
                  <option value="SPECIFIC">👤 Specific Individual Users (Multi-select)</option>
                </select>
              </div>

              {/* Specific Individual Users Picker */}
              {(targetGroup === "SPECIFIC" || targetGroup === "ALL") && (
                <div className="space-y-2 pt-2 border-t border-violet-200/60 dark:border-violet-800/40">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-foreground">
                      Target Specific People ({targetUserIds.length} selected)
                    </Label>
                    {targetUserIds.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setTargetUserIds([])}
                        className="h-6 text-[10px] text-rose-500 hover:bg-rose-50"
                      >
                        Clear Selection
                      </Button>
                    )}
                  </div>

                  <Input
                    placeholder="Search users by name, email or role..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />

                  <div className="max-h-40 overflow-y-auto rounded-md border bg-background p-2 space-y-1">
                    {filteredUsersForTarget.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground text-center py-2">
                        No active users found.
                      </p>
                    ) : (
                      filteredUsersForTarget.map((u) => {
                        const isChecked = targetUserIds.includes(u.id);
                        return (
                          <div
                            key={u.id}
                            onClick={() => handleToggleUserTarget(u.id)}
                            className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer text-xs transition-colors ${
                              isChecked
                                ? "bg-violet-100 dark:bg-violet-950/60 font-medium text-violet-700 dark:text-violet-300"
                                : "hover:bg-accent text-foreground"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Checkbox checked={isChecked} onCheckedChange={() => handleToggleUserTarget(u.id)} />
                              <span className="truncate">{u.name || u.email}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider shrink-0 ml-2">
                              {u.role || "User"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label>Announcement Content *</Label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write your announcement body text..."
                minHeight="160px"
              />
            </div>

            {/* File Attachment */}
            <div className="space-y-1 pt-1">
              <Label>Attach File (Optional PDF, Document, Image, Spreadsheet)</Label>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setAttachedFile(e.target.files[0]);
                  }
                }}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs"
                >
                  <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                  {attachedFile ? "Change File" : "Choose File"}
                </Button>
                {attachedFile && (
                  <span className="text-xs font-medium text-violet-600 truncate max-w-[200px]">
                    {attachedFile.name}
                  </span>
                )}
                {!attachedFile && existingAttachmentName && (
                  <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                    Existing: {existingAttachmentName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={submitting}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {submitting ? "Publishing..." : editingId ? "Update Notice" : "Publish Notice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
