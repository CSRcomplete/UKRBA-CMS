"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type AnnouncementItem,
} from "@/actions/news/news";
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

export function NewsClient() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Company News");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
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
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  };

  const openPublishModal = () => {
    setEditingId(null);
    setTitle("");
    setCategory("Company News");
    setContent("");
    setIsPinned(false);
    setAttachedFile(null);
    setExistingAttachmentName(null);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: AnnouncementItem) => {
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setContent(item.content);
    setIsPinned(item.isPinned);
    setAttachedFile(null);
    setExistingAttachmentName(item.attachmentName || null);
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Please provide a title and content for the announcement.");
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
          attachment: attachmentPayload,
        });
      } else {
        await createAnnouncement({
          title,
          category,
          content,
          isPinned,
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
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white gap-1"><Building className="h-3 w-3" /> {cat}</Badge>;
      case "Marketing Campaigns":
        return <Badge className="bg-pink-600 hover:bg-pink-700 text-white gap-1"><Radio className="h-3 w-3" /> {cat}</Badge>;
      case "Operational Updates":
        return <Badge className="bg-amber-600 hover:bg-amber-700 text-white gap-1"><FileText className="h-3 w-3" /> {cat}</Badge>;
      case "Software Updates":
        return <Badge className="bg-cyan-600 hover:bg-cyan-700 text-white gap-1"><Code className="h-3 w-3" /> {cat}</Badge>;
      case "New Resources":
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white gap-1"><FileText className="h-3 w-3" /> {cat}</Badge>;
      case "Compliance Notices":
        return <Badge className="bg-red-600 hover:bg-red-700 text-white gap-1"><ShieldCheck className="h-3 w-3" /> {cat}</Badge>;
      case "Staff Announcements":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"><Users className="h-3 w-3" /> {cat}</Badge>;
      default:
        return <Badge variant="secondary">{cat}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            News & Announcements Noticeboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Internal company noticeboard for official UKRBA updates, compliance, and staff news.
          </p>
        </div>

        {isAdmin && (
          <Button onClick={openPublishModal} className="gap-1.5 font-semibold">
            <Plus className="h-4 w-4" /> Publish Announcement
          </Button>
        )}
      </div>

      {/* Filter Category Pills & Search */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              size="sm"
              className="text-xs h-7 rounded-full"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements..."
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>

      {/* Announcements Feed */}
      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading announcements...</div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="p-12 text-center border rounded-xl bg-card">
          <Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
          <h3 className="text-base font-semibold">No announcements found</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedCategory === "All"
              ? "There are currently no published announcements."
              : `No announcements published under category "${selectedCategory}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnouncements.map((item) => (
            <Card
              key={item.id}
              className={`transition-all hover:shadow-md border-l-4 ${
                item.isPinned
                  ? "border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/10"
                  : "border-l-primary"
              }`}
            >
              <CardHeader className="pb-3 pt-4 px-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.isPinned && (
                        <Badge className="bg-amber-500 text-white gap-1 font-semibold text-xs">
                          <Pin className="h-3 w-3" /> Pinned Notice
                        </Badge>
                      )}
                      {getCategoryBadge(item.category)}
                    </div>
                    <CardTitle className="text-lg font-bold">{item.title}</CardTitle>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditModal(item)}
                        title="Edit Announcement"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                        title="Delete Announcement"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <strong className="text-foreground">{item.authorName}</strong> ({item.authorRole})
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(parseISO(item.createdAt), "PPpp")}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="px-5 py-2 text-sm leading-relaxed border-t border-b bg-background/50">
                <div
                  className="prose dark:prose-invert max-w-none text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              </CardContent>

              {item.attachmentUrl && (
                <CardFooter className="px-5 py-3 bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <Paperclip className="h-4 w-4 text-primary" />
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
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
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
        <DialogContent className="max-w-xl">
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
                placeholder="e.g. Q3 Compliance Guidelines & New Operational Standards"
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
                  className="text-xs gap-1.5"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  {attachedFile
                    ? `Attached: ${attachedFile.name}`
                    : existingAttachmentName
                    ? `Current File: ${existingAttachmentName}`
                    : "Choose File Attachment"}
                </Button>

                {(attachedFile || existingAttachmentName) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setAttachedFile(null);
                      setExistingAttachmentName(null);
                    }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={submitting}>
              {submitting ? "Publishing..." : editingId ? "Save Changes" : "Publish Announcement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
