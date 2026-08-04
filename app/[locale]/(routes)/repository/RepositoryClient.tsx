"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Folder,
  Plus,
  FileText,
  Film,
  Download,
  User,
  Calendar,
  Info,
  Play,
  Building2,
  Palette,
  Megaphone,
  TrendingUp,
  GraduationCap,
  Newspaper,
  ChevronRight,
  ArrowLeft,
  Upload,
  X,
  CheckCircle2,
  Loader2,
  Search,
  Lock,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRepositoryDocument, deleteRepositoryDocument } from "@/actions/documents/create-repository-document";
import { toast } from "sonner";
import moment from "moment";

export interface FolderConfig {
  id: string;
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
  subfolders: string[];
}

export const REPOSITORY_STRUCTURE: FolderConfig[] = [
  {
    id: "01-company-info",
    name: "01. Company Information",
    icon: Building2,
    color: "blue",
    bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-600 dark:text-blue-400",
    description: "About UKRBA, Fact Sheets, Policies & FAQs",
    subfolders: ["About UKRBA", "Fact Sheets", "Company Policies", "FAQs"],
  },
  {
    id: "02-brand-assets",
    name: "02. Brand Assets",
    icon: Palette,
    color: "purple",
    bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    textColor: "text-purple-600 dark:text-purple-400",
    description: "Logos, brand guidelines, badge packs & templates",
    subfolders: [
      "Logo Pack",
      "Brand Guidelines",
      "Badge Pack",
      "Fonts",
      "Brand Colours",
      "Templates",
    ],
  },
  {
    id: "03-marketing",
    name: "03. Marketing",
    icon: Megaphone,
    color: "amber",
    bgColor: "bg-amber-500/10 dark:bg-amber-500/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    textColor: "text-amber-600 dark:text-amber-400",
    description: "Ads, social posts, videos, press releases & case studies",
    subfolders: [
      "Advertising Images",
      "Social Media Posts",
      "Marketing Videos",
      "Marketing Manual",
      "Press Releases",
      "Email Campaigns",
      "Exhibition Material",
      "Case Studies",
    ],
  },
  {
    id: "04-sales",
    name: "04. Sales",
    icon: TrendingUp,
    color: "emerald",
    bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    textColor: "text-emerald-600 dark:text-emerald-400",
    description: "Sales scripts, presentations, price lists & proposals",
    subfolders: [
      "Sales Guides",
      "Sales Scripts",
      "Sales Presentations",
      "Price Lists",
      "Membership Information",
      "White Label",
      "Strategic Partnerships",
      "Proposal Templates",
    ],
  },
  {
    id: "05-training",
    name: "05. Training",
    icon: GraduationCap,
    color: "indigo",
    bgColor: "bg-indigo-500/10 dark:bg-indigo-500/20",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    textColor: "text-indigo-600 dark:text-indigo-400",
    description: "CRM, sales & marketing training for new starters & staff",
    subfolders: [
      "CRM Training",
      "Sales Training",
      "Marketing Training",
      "New Starter",
    ],
  },
  {
    id: "06-in-the-press",
    name: "06. In the Press",
    icon: Newspaper,
    color: "rose",
    bgColor: "bg-rose-500/10 dark:bg-rose-500/20",
    borderColor: "border-rose-200 dark:border-rose-800",
    textColor: "text-rose-600 dark:text-rose-400",
    description: "Press coverage, media features & articles",
    subfolders: ["General Press", "Media Coverage", "Articles"],
  },
];

interface RepositoryClientProps {
  documents: any[];
  users: any[];
  currentUserId: string;
  currentUserRole: string;
  canUpload: boolean;
}

export default function RepositoryClient({
  documents,
  users,
  currentUserId,
  currentUserRole,
  canUpload,
}: RepositoryClientProps) {
  const router = useRouter();

  // Navigation states
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedSubfolder, setSelectedSubfolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Upload modal states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFolder, setUploadFolder] = useState<string>("01. Company Information");
  const [uploadSubfolder, setUploadSubfolder] = useState<string>("About UKRBA");
  const [fileQueue, setFileQueue] = useState<File[]>([]);
  const [fileDescriptions, setFileDescriptions] = useState<{ [key: string]: string }>({});
  const [assignedUser, setAssignedUser] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  // Video modal state
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteDocument = async (docId: string, docName: string) => {
    if (!canUpload) return;
    if (!confirm(`Are you sure you want to delete "${docName}" from the repository?`)) return;

    setDeletingId(docId);
    try {
      await deleteRepositoryDocument(docId);
      toast.success(`"${docName}" deleted successfully.`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete document");
    } finally {
      setDeletingId(null);
    }
  };

  // Get active folder configuration
  const currentFolderConfig = useMemo(() => {
    if (!selectedFolder) return null;
    return REPOSITORY_STRUCTURE.find((f) => f.name === selectedFolder) || null;
  }, [selectedFolder]);

  // Dynamic subfolders list for upload dropdown
  const currentUploadFolderConfig = useMemo(() => {
    return REPOSITORY_STRUCTURE.find((f) => f.name === uploadFolder) || REPOSITORY_STRUCTURE[0];
  }, [uploadFolder]);

  // Handle main folder change in upload modal
  const handleUploadFolderChange = (newFolder: string) => {
    setUploadFolder(newFolder);
    const config = REPOSITORY_STRUCTURE.find((f) => f.name === newFolder);
    if (config && config.subfolders.length > 0) {
      setUploadSubfolder(config.subfolders[0]);
    } else {
      setUploadSubfolder("General");
    }
  };

  // Helper to extract folder and subfolder from document tags or description
  const getDocFolder = (doc: any): string => {
    if (doc.tags && typeof doc.tags === "object" && doc.tags.folder) {
      return doc.tags.folder;
    }
    // Fallback search in description or default
    for (const folder of REPOSITORY_STRUCTURE) {
      if (doc.description?.includes(folder.name)) {
        return folder.name;
      }
    }
    return "01. Company Information";
  };

  const getDocSubfolder = (doc: any): string => {
    if (doc.tags && typeof doc.tags === "object" && doc.tags.subfolder) {
      return doc.tags.subfolder;
    }
    return "General";
  };

  // Calculate file counts for each folder & subfolder
  const folderCounts = useMemo(() => {
    const counts: { [folder: string]: { total: number; [subfolder: string]: number } } = {};

    REPOSITORY_STRUCTURE.forEach((folder) => {
      counts[folder.name] = { total: 0 };
      folder.subfolders.forEach((sub) => {
        counts[folder.name][sub] = 0;
      });
    });

    documents.forEach((doc) => {
      const folder = getDocFolder(doc);
      const sub = getDocSubfolder(doc);

      if (counts[folder]) {
        counts[folder].total += 1;
        if (counts[folder][sub] !== undefined) {
          counts[folder][sub] += 1;
        } else {
          counts[folder][sub] = 1;
        }
      }
    });

    return counts;
  }, [documents]);

  // Filtered documents list
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const docFolder = getDocFolder(doc);
      const docSubfolder = getDocSubfolder(doc);

      if (selectedFolder && docFolder !== selectedFolder) {
        return false;
      }

      if (selectedSubfolder && docSubfolder !== selectedSubfolder) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = doc.document_name?.toLowerCase().includes(q);
        const matchesDesc = doc.description?.toLowerCase().includes(q);
        const matchesSub = docSubfolder.toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesSub;
      }

      return true;
    });
  }, [documents, selectedFolder, selectedSubfolder, searchQuery]);

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canUpload) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, [canUpload]);

  const handleDrop = useCallback((e: React.DragEvent, targetFolder?: string, targetSubfolder?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!canUpload) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFileQueue((prev) => [...prev, ...droppedFiles]);

      if (targetFolder) {
        setUploadFolder(targetFolder);
        const config = REPOSITORY_STRUCTURE.find((f) => f.name === targetFolder);
        if (targetSubfolder) {
          setUploadSubfolder(targetSubfolder);
        } else if (config && config.subfolders.length > 0) {
          setUploadSubfolder(config.subfolders[0]);
        }
      } else if (selectedFolder) {
        setUploadFolder(selectedFolder);
        if (selectedSubfolder) {
          setUploadSubfolder(selectedSubfolder);
        }
      }

      setIsUploadOpen(true);
    }
  }, [canUpload, selectedFolder, selectedSubfolder]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setFileQueue((prev) => [...prev, ...selected]);
    }
  };

  const removeFileFromQueue = (index: number) => {
    setFileQueue((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit batch upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (fileQueue.length === 0) {
      setUploadError("Please select or drop at least one file.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    let successCount = 0;

    for (let i = 0; i < fileQueue.length; i++) {
      const file = fileQueue[i];
      setUploadProgressText(`Uploading file ${i + 1} of ${fileQueue.length}: ${file.name}`);

      try {
        const isVideo = file.type.startsWith("video/");
        const folder = isVideo ? "uploads" : "documents";

        let fileUrl: string;
        let key: string;

        try {
          // Attempt 1: Presigned URL upload
          const presignRes = await fetch("/api/upload/presigned-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type,
              folder,
            }),
          });

          if (!presignRes.ok) {
            throw new Error("Presign request failed");
          }

          const presignData = await presignRes.json();
          const putRes = await fetch(presignData.presignedUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type },
            body: file,
          });

          if (!putRes.ok) {
            throw new Error("Presigned PUT failed");
          }

          fileUrl = presignData.fileUrl;
          key = presignData.key;
        } catch {
          // Attempt 2: Fallback to /api/upload endpoint (multipart form data)
          const formData = new FormData();
          formData.append("file", file);
          formData.append("folder", folder);

          const uploadRes = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadRes.ok) {
            const errText = await uploadRes.text();
            let message = `Upload failed for ${file.name}`;
            try {
              message = JSON.parse(errText).error || message;
            } catch {
              // keep fallback message
            }
            throw new Error(message);
          }

          const uploadData = await uploadRes.json();
          fileUrl = uploadData.fileUrl;
          key = uploadData.key;
        }

        const customDesc = fileDescriptions[file.name] || `${uploadFolder} > ${uploadSubfolder}`;

        await createRepositoryDocument({
          name: file.name.replace(/\.[^/.]+$/, ""),
          url: fileUrl,
          key,
          size: file.size,
          mimeType: file.type,
          description: customDesc,
          folder: uploadFolder,
          subfolder: uploadSubfolder,
          assignedUser: assignedUser === "all" ? null : assignedUser,
        });

        successCount++;
      } catch (err: any) {
        console.error(err);
        setUploadError(err.message || `Failed uploading ${file.name}`);
        setIsUploading(false);
        return;
      }
    }

    // Reset and close
    setFileQueue([]);
    setFileDescriptions({});
    setUploadProgressText("");
    setIsUploading(false);
    setIsUploadOpen(false);
    router.refresh();
  };

  return (
    <div 
      className="space-y-6 relative"
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={(e) => handleDrop(e)}
    >
      {/* Drag Overlay indicator */}
      {dragActive && canUpload && (
        <div className="fixed inset-0 z-50 bg-primary/20 backdrop-blur-sm border-4 border-dashed border-primary flex items-center justify-center p-6 text-center pointer-events-none">
          <div className="bg-background/90 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 max-w-md">
            <Upload className="h-16 w-16 text-primary animate-bounce" />
            <h3 className="text-xl font-bold">Drop files to upload to Repository</h3>
            <p className="text-sm text-muted-foreground">
              Files will be assigned to {selectedFolder || "selected folder"}
            </p>
          </div>
        </div>
      )}

      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FolderOpen className="h-7 w-7 text-primary" />
            <span>Resource & Training Repository</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Official UKRBA documents, brand assets, sales guides, marketing media & staff training.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canUpload ? (
            <Button
              onClick={() => {
                if (selectedFolder) setUploadFolder(selectedFolder);
                if (selectedSubfolder) setUploadSubfolder(selectedSubfolder);
                setIsUploadOpen(true);
              }}
              className="flex items-center gap-2 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Resource</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-200 dark:border-amber-800">
              <Lock className="h-3.5 w-3.5" />
              <span>Read-Only Access (Only CEO & Admin can upload)</span>
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 px-4 py-2.5 rounded-lg border">
        <button
          onClick={() => {
            setSelectedFolder(null);
            setSelectedSubfolder(null);
            setSearchQuery("");
          }}
          className="hover:text-primary font-medium transition-colors flex items-center gap-1.5"
        >
          <FolderOpen className="h-4 w-4" />
          <span>Repository</span>
        </button>

        {selectedFolder && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
            <button
              onClick={() => {
                setSelectedSubfolder(null);
                setSearchQuery("");
              }}
              className="hover:text-primary font-semibold text-foreground transition-colors"
            >
              {selectedFolder}
            </button>
          </>
        )}

        {selectedSubfolder && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
            <span className="font-bold text-primary">{selectedSubfolder}</span>
          </>
        )}
      </div>

      {/* VIEW 1: Main Folders Grid (Root View) */}
      {!selectedFolder && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {REPOSITORY_STRUCTURE.map((folder) => {
              const IconComponent = folder.icon;
              const countInfo = folderCounts[folder.name] || { total: 0 };

              return (
                <div
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.name)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, folder.name)}
                  className={`group relative overflow-hidden rounded-xl border p-6 bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer ${folder.borderColor}`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${folder.bgColor} ${folder.textColor} transition-transform group-hover:scale-110`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                      {countInfo.total} {countInfo.total === 1 ? "file" : "files"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <h3 className={`text-lg font-bold transition-colors ${folder.textColor}`}>
                      {folder.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {folder.description}
                    </p>
                  </div>

                  {/* Subfolder Badges Preview */}
                  <div className="mt-4 pt-3 border-t border-muted/60 flex flex-wrap gap-1.5">
                    {folder.subfolders.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted/50 text-muted-foreground group-hover:bg-muted group-hover:text-foreground transition-colors"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Subfolders & Documents Detail View */}
      {selectedFolder && (
        <div className="space-y-6">
          {/* Subfolders Navigation Tabs & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border p-4 rounded-xl shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={selectedSubfolder === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSubfolder(null)}
                className="rounded-lg text-xs"
              >
                All in {selectedFolder.split(" ")[1] || selectedFolder}
              </Button>
              {currentFolderConfig?.subfolders.map((sub) => {
                const isSelected = selectedSubfolder === sub;
                const subCount = folderCounts[selectedFolder]?.[sub] || 0;
                return (
                  <Button
                    key={sub}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSubfolder(sub)}
                    className="rounded-lg text-xs flex items-center gap-1.5"
                  >
                    <span>{sub}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {subCount}
                    </span>
                  </Button>
                );
              })}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>
          </div>

          {/* Files List Table */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
            <div className="p-6">
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center gap-3">
                  <FolderOpen className="h-12 w-12 text-muted-foreground/40" />
                  <div className="font-semibold text-base text-foreground">No resources found in this folder</div>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    {canUpload
                      ? "Click 'Add Resource' or drag and drop files directly onto this area to upload resources."
                      : "No training manuals or files have been added to this section yet."}
                  </p>
                  {canUpload && (
                    <Button
                      onClick={() => {
                        setUploadFolder(selectedFolder);
                        if (selectedSubfolder) setUploadSubfolder(selectedSubfolder);
                        setIsUploadOpen(true);
                      }}
                      variant="outline"
                      size="sm"
                      className="mt-2 flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Upload Files Now</span>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-muted text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Type</th>
                        <th className="pb-3 font-semibold">Resource Name</th>
                        <th className="pb-3 font-semibold">Subfolder</th>
                        <th className="pb-3 font-semibold">Uploaded By</th>
                        <th className="pb-3 font-semibold">Upload Date</th>
                        <th className="pb-3 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-muted">
                      {filteredDocuments.map((doc) => {
                        const isVideo = doc.document_file_mimeType?.startsWith("video/");
                        const subName = getDocSubfolder(doc);

                        return (
                          <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-4">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                isVideo
                                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400"
                                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                              }`}>
                                {isVideo ? <Film className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                                {isVideo ? "Video" : "Document"}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="font-semibold text-foreground">{doc.document_name}</div>
                              {doc.description && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <Info className="h-3.5 w-3.5 text-muted-foreground/80" />
                                  <span>{doc.description}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground">
                                {subName}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="text-xs font-medium flex items-center gap-1">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{doc.created_by?.name || doc.created_by?.email || "Admin"}</span>
                              </div>
                            </td>
                            <td className="py-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{moment(doc.createdAt || doc.date_created).format("MMM DD, YYYY")}</span>
                              </div>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isVideo ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-1.5 text-purple-600 hover:text-purple-700 dark:text-purple-400"
                                    onClick={() => {
                                      const docKey = doc.key || (doc.document_file_url?.includes("/nextcrm/") ? doc.document_file_url.split("/nextcrm/").pop() : null);
                                      setActiveVideoUrl(docKey ? `/api/upload/file?key=${encodeURIComponent(docKey)}` : doc.document_file_url);
                                      setActiveVideoTitle(doc.document_name);
                                    }}
                                  >
                                    <Play className="h-3.5 w-3.5 fill-current" />
                                    <span>Watch</span>
                                  </Button>
                                ) : (
                                  <a
                                    href={(() => {
                                      const docKey = doc.key || (doc.document_file_url?.includes("/nextcrm/") ? doc.document_file_url.split("/nextcrm/").pop() : null);
                                      return docKey ? `/api/upload/file?key=${encodeURIComponent(docKey)}` : doc.document_file_url;
                                    })()}
                                    target="_blank"
                                    rel="noreferrer"
                                    download
                                  >
                                    <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                                      <Download className="h-3.5 w-3.5" />
                                      <span>Download</span>
                                    </Button>
                                  </a>
                                )}
                                {canUpload && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    disabled={deletingId === doc.id}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                                    onClick={() => handleDeleteDocument(doc.id, doc.document_name)}
                                    title="Delete file from repository"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi-File Upload Dialog (CEO / ADMIN ONLY) */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="sm:max-w-[580px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              <span>Add Resource to Repository</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUploadSubmit} className="space-y-5 pt-2">
            {uploadError && (
              <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-md font-medium">
                {uploadError}
              </div>
            )}

            {/* Folder & Subfolder Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/40 p-4 rounded-xl border">
              <div className="space-y-1.5">
                <Label htmlFor="mainFolder" className="text-xs font-semibold">1. Main Folder</Label>
                <Select value={uploadFolder} onValueChange={handleUploadFolderChange}>
                  <SelectTrigger id="mainFolder" className="h-9 text-xs">
                    <SelectValue placeholder="Select folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPOSITORY_STRUCTURE.map((f) => (
                      <SelectItem key={f.id} value={f.name} className="text-xs">
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="subfolder" className="text-xs font-semibold">2. Target Subfolder</Label>
                <Select value={uploadSubfolder} onValueChange={setUploadSubfolder}>
                  <SelectTrigger id="subfolder" className="h-9 text-xs">
                    <SelectValue placeholder="Select subfolder" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentUploadFolderConfig.subfolders.map((sub) => (
                      <SelectItem key={sub} value={sub} className="text-xs">
                        {sub}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Multi-File Dropzone / Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Select or Drop Files</Label>
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-6 text-center hover:border-primary/50 transition-colors bg-muted/20">
                <Input
                  id="multiFileInput"
                  type="file"
                  multiple
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <label htmlFor="multiFileInput" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-xs text-foreground font-medium">
                    Click to browse or drag and drop files here
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    All file types supported (PDF, DOCX, SVG, PSD, AI, CSV, ZIP, Videos &amp; more)
                  </div>
                </label>
              </div>
            </div>

            {/* File Queue List */}
            {fileQueue.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-xl p-3 bg-card">
                <div className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                  <span>Files ready for upload ({fileQueue.length})</span>
                  <button
                    type="button"
                    onClick={() => setFileQueue([])}
                    className="text-[11px] text-red-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
                {fileQueue.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/40 text-xs gap-3">
                    <div className="flex items-center gap-2 truncate">
                      {file.type.startsWith("video/") ? (
                        <Film className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      )}
                      <span className="truncate font-medium">{file.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFileFromQueue(idx)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Progress Indicator */}
            {isUploading && (
              <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs rounded-xl flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{uploadProgressText}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading || fileQueue.length === 0}>
                {isUploading ? "Uploading..." : `Upload ${fileQueue.length} ${fileQueue.length === 1 ? "File" : "Files"}`}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Video Playback Modal */}
      <Dialog open={!!activeVideoUrl} onOpenChange={(open) => !open && setActiveVideoUrl(null)}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden bg-black text-white">
          <DialogHeader className="p-4 bg-zinc-900 border-b border-zinc-800">
            <DialogTitle className="text-white flex items-center gap-2">
              <Film className="h-5 w-5 text-purple-500" />
              <span>{activeVideoTitle}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            {activeVideoUrl && (
              <video src={activeVideoUrl} controls className="w-full h-full" autoPlay />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
