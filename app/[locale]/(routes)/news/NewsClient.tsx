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
  BookOpen,
  ArrowRight,
  Sparkles,
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

async function uploadAnnouncementAttachment(file: File): Promise<{
  name: string;
  url: string;
  contentType: string;
  size: number;
}> {
  const presignRes = await fetch("/api/upload/presigned-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      folder: "documents",
    }),
  });

  if (!presignRes.ok) {
    const errJson = await presignRes.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to prepare upload for "${file.name}"`);
  }

  const { presignedUrl, fileUrl } = await presignRes.json();

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl);
    if (file.type) xhr.setRequestHeader("Content-Type", file.type);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload of "${file.name}" was rejected by storage (status ${xhr.status})`));
    };
    xhr.onerror = () => reject(new Error(`Network error uploading "${file.name}"`));
    xhr.send(file);
  });

  return {
    name: file.name,
    url: fileUrl,
    contentType: file.type || "application/octet-stream",
    size: file.size,
  };
}

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

  // Blog Article Reader modal state
  const [selectedArticle, setSelectedArticle] = useState<AnnouncementItem | null>(null);

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

  const openEditModal = (item: AnnouncementItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
        attachmentPayload = await uploadAnnouncementAttachment(attachedFile);
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

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
            Internal company noticeboard for official UKRBA updates, compliance, targeted notices, and staff news. Click any announcement to read the full article.
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
              onClick={() => setSelectedArticle(item)}
              className={`group overflow-hidden transition-all duration-200 cursor-pointer hover:border-violet-500 hover:shadow-lg ${
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
                    <CardTitle className="text-lg font-bold text-foreground leading-snug group-hover:text-violet-600 transition-colors">
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
                        {format(parseISO(item.createdAt), "MMM d, yyyy, h:mm a")}
                      </span>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => openEditModal(item, e)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(item.id, e)}
                        className="h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pb-3">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed text-foreground/90 line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              </CardContent>

              <CardFooter className="px-6 py-2.5 bg-muted/20 flex items-center justify-between border-t border-border/40">
                <div className="flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400 group-hover:translate-x-1 transition-transform">
                  <BookOpen className="h-3.5 w-3.5" />
                  Read Full Article
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>

                {item.attachmentUrl && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Paperclip className="h-3.5 w-3.5 text-violet-600" />
                    <span>Attachment available</span>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* ── BLOG ARTICLE READER MODAL ────────────────────────────────────────────── */}
      <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-2xl border border-violet-200 dark:border-violet-900 shadow-2xl">
          {selectedArticle && (
            <div>
              {/* Header Cover Bar */}
              <div className="relative p-6 sm:p-8 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white rounded-t-2xl space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedArticle.isPinned && (
                    <Badge className="bg-amber-400 text-amber-950 font-bold flex items-center gap-1">
                      <Pin className="h-3 w-3 fill-amber-950" /> Pinned Official Notice
                    </Badge>
                  )}
                  <Badge className="bg-white/20 text-white backdrop-blur-md border-0">
                    {selectedArticle.category}
                  </Badge>
                  <Badge className="bg-white/20 text-white backdrop-blur-md border-0">
                    {selectedArticle.targetGroup === "ALL_REGIONAL_DIRECTORS"
                      ? "👔 Regional Directors"
                      : selectedArticle.targetGroup === "ALL_AREA_DIRECTORS"
                      ? "🏢 Area Managers"
                      : selectedArticle.targetGroup === "ALL_CHANNEL_PARTNERS"
                      ? "🤝 Channel Partners"
                      : selectedArticle.targetGroup === "SPECIFIC"
                      ? "👤 Targeted Notice"
                      : "👥 All Staff"}
                  </Badge>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug">
                  {selectedArticle.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-white/90 pt-2 border-t border-white/20">
                  <div className="flex items-center gap-2 font-medium">
                    <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center font-bold text-white">
                      {selectedArticle.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span>{selectedArticle.authorName}</span>
                      <span className="block text-[10px] text-white/70">{selectedArticle.authorRole}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(parseISO(selectedArticle.createdAt), "MMMM d, yyyy [at] h:mm a")}</span>
                  </div>
                </div>
              </div>

              {/* Main Article Body */}
              <div className="p-6 sm:p-8 space-y-6 bg-background">
                <div
                  className="prose prose-violet dark:prose-invert max-w-none text-base leading-relaxed text-foreground min-h-[160px]"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                />

                {/* File Attachment Box inside Article */}
                {selectedArticle.attachmentUrl && (
                  <div className="rounded-xl border border-violet-200 dark:border-violet-900/60 bg-violet-50/50 dark:bg-violet-950/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600 text-white shrink-0">
                        <Paperclip className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {selectedArticle.attachmentName || "Attached Document"}
                        </p>
                        {selectedArticle.attachmentSize && (
                          <p className="text-xs text-muted-foreground">
                            File size: {Math.round(selectedArticle.attachmentSize / 1024)} KB
                          </p>
                        )}
                      </div>
                    </div>

                    <a
                      href={selectedArticle.attachmentUrl}
                      download={selectedArticle.attachmentName || "attachment"}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button className="bg-violet-600 hover:bg-violet-700 text-white text-xs gap-2">
                        <Download className="h-4 w-4" />
                        Download Attached File
                      </Button>
                    </a>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-muted/30 border-t flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-violet-600" /> UKRBA Official Announcement
                </span>
                <Button variant="outline" size="sm" onClick={() => setSelectedArticle(null)}>
                  Close Article
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── PUBLISH / EDIT MODAL (Admin Only) ─────────────────────────────────── */}
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
