"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FolderOpen, 
  Plus, 
  FileText, 
  Film, 
  Download, 
  User, 
  Calendar, 
  Info,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createRepositoryDocument } from "@/actions/documents/create-repository-document";
import moment from "moment";

interface RepositoryClientProps {
  documents: any[];
  users: any[];
  currentUserId: string;
  currentUserRole: string;
}

export default function RepositoryClient({
  documents,
  users,
  currentUserId,
  currentUserRole,
}: RepositoryClientProps) {
  const router = useRouter();
  
  // Dialog states
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeVideoTitle, setActiveVideoTitle] = useState<string>("");

  // Upload form states
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<"regional_director" | "area_director" | "channel_partner">("channel_partner");
  const [assignedUser, setAssignedUser] = useState("all");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Determine allowed tabs and repository levels based on user role
  const isSuperUser = ["admin", "ceo", "operations_director"].includes(currentUserRole);
  const isRD = currentUserRole === "regional_director";
  const isAD = currentUserRole === "area_director";
  const isCP = currentUserRole === "channel_partner";

  const allowedTabs: { value: string; label: string }[] = [];
  if (isSuperUser || isRD) {
    allowedTabs.push({ value: "regional_director", label: "Regional Director Level" });
  }
  if (isSuperUser || isRD || isAD) {
    allowedTabs.push({ value: "area_director", label: "Area Director Level" });
  }
  if (isSuperUser || isRD || isAD || isCP) {
    allowedTabs.push({ value: "channel_partner", label: "Channel Partner Level" });
  }

  const [activeTab, setActiveTab] = useState(allowedTabs[0]?.value || "channel_partner");

  const filteredDocs = documents.filter((doc) => doc.visibility === activeTab);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      // Auto-populate name if empty
      if (!name) {
        setName(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name) {
      setUploadError("Please select a file and provide a name.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      // 1. Upload via backend proxy API
      const folder = file.type.startsWith("video/") ? "uploads" : "documents";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Upload failed");
      }
      
      const { fileUrl, key } = await res.json();

      // 3. Create document in database
      await createRepositoryDocument({
        name,
        url: fileUrl,
        key,
        size: file.size,
        mimeType: file.type,
        description,
        level,
        assignedUser: assignedUser === "all" ? null : assignedUser,
      });

      // Clear states and reload
      setFile(null);
      setName("");
      setDescription("");
      setAssignedUser("all");
      setIsUploadOpen(false);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "An unexpected error occurred during upload.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Upload Trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-primary" />
            <span>Resource & Training Repository</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Access secure training manuals, guidelines, and videos by role tier.
          </p>
        </div>

        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Resource</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Resource to Repository</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUploadSubmit} className="space-y-4 pt-4">
              {uploadError && (
                <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-md">
                  {uploadError}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="file">File (PDF, Doc, Image, or Video)</Label>
                <Input 
                  id="file" 
                  type="file" 
                  onChange={handleFileChange} 
                  required 
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*,video/*"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="name">Resource Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Enter custom resource name" 
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description / Training Notes</Label>
                <textarea 
                  id="description" 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Details about manuals or training reference"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="level">Target Repository Level</Label>
                  <Select 
                    value={level} 
                    onValueChange={(val: any) => setLevel(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {(isSuperUser || isRD) && (
                        <SelectItem value="regional_director">Regional Director</SelectItem>
                      )}
                      {(isSuperUser || isRD || isAD) && (
                        <SelectItem value="area_director">Area Director</SelectItem>
                      )}
                      <SelectItem value="channel_partner">Channel Partner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="assignee">Assign Visible To</Label>
                  <Select 
                    value={assignedUser} 
                    onValueChange={setAssignedUser}
                  >
                    <SelectTrigger id="assignee">
                      <SelectValue placeholder="Select User" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Everyone at this level</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name || u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? "Uploading & Saving..." : "Add to Repository"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="border-b border-muted">
        <div className="flex gap-4">
          {allowedTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 px-1 ${
                activeTab === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resource List */}
      <div className="rounded-md border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center gap-3">
              <FolderOpen className="h-10 w-10 text-muted-foreground/50" />
              <div>No training manuals or files found in this level repository.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-muted text-muted-foreground">
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Resource Name</th>
                    <th className="pb-3 font-medium">Uploaded By</th>
                    <th className="pb-3 font-medium">Assigned To</th>
                    <th className="pb-3 font-medium">Upload Date</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted">
                  {filteredDocs.map((doc) => {
                    const isVideo = doc.document_file_mimeType.startsWith("video/");
                    return (
                      <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-4">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isVideo 
                              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400"
                              : "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400"
                          }`}>
                            {isVideo ? <Film className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
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
                          <div className="text-sm font-medium flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{doc.created_by?.name || doc.created_by?.email || "System"}</span>
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="text-sm font-medium flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{doc.assigned_to_user?.name || doc.assigned_to_user?.email || "Unassigned"}</span>
                          </div>
                        </td>
                        <td className="py-4 text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{moment(doc.createdAt).format("MMM DD, YYYY")}</span>
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isVideo ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-1 text-purple-600 hover:text-purple-700 dark:text-purple-400"
                                onClick={() => {
                                  setActiveVideoUrl(doc.document_file_url);
                                  setActiveVideoTitle(doc.document_name);
                                }}
                              >
                                <Play className="h-3.5 w-3.5 fill-current" />
                                <span>Watch</span>
                              </Button>
                            ) : (
                              <a href={doc.document_file_url} target="_blank" rel="noreferrer">
                                <Button variant="outline" size="sm" className="flex items-center gap-1">
                                  <Download className="h-3.5 w-3.5" />
                                  <span>Download</span>
                                </Button>
                              </a>
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
              <video 
                src={activeVideoUrl} 
                controls 
                className="w-full h-full"
                autoPlay
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
