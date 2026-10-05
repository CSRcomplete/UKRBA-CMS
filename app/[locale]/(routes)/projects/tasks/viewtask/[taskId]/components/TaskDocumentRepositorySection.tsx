"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  Paperclip,
  Trash2,
  Download,
  Plus,
  Loader2,
  CheckCircle,
  File,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { uploadTaskDocument } from "@/actions/projects/upload-task-document";
import {
  assignDocumentToTask,
  disconnectDocumentFromTask,
} from "@/actions/projects/assign-document-to-task";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DocumentItem {
  id: string;
  document_name: string;
  document_file_url: string;
  document_file_mimeType?: string;
  size?: number | null;
  date_created?: Date | string | null;
  created_by_user?: { name: string | null } | null;
  assigned_to_user?: { name: string | null } | null;
}

interface TaskDocumentRepositorySectionProps {
  taskId: string;
  taskDocuments: DocumentItem[];
  availableDocuments: DocumentItem[];
}

export function TaskDocumentRepositorySection({
  taskId,
  taskDocuments = [],
  availableDocuments = [],
}: TaskDocumentRepositorySectionProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [selectedDocToAttach, setSelectedDocToAttach] = useState<string>("");
  const [isAttaching, setIsAttaching] = useState(false);
  const [isDisconnectingId, setIsDisconnectingId] = useState<string | null>(null);

  // Format file size
  const formatSize = (bytes?: number | null) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file icon based on mime type
  const getFileIcon = (mime?: string) => {
    if (!mime) return <FileText className="h-5 w-5 text-blue-500" />;
    if (mime.includes("image")) return <ImageIcon className="h-5 w-5 text-emerald-500" />;
    if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv"))
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    if (mime.includes("pdf")) return <FileText className="h-5 w-5 text-rose-500" />;
    if (mime.includes("code") || mime.includes("json"))
      return <FileCode className="h-5 w-5 text-purple-500" />;
    return <File className="h-5 w-5 text-slate-500" />;
  };

  // Handle direct file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const fileUrl = reader.result as string;
        const res = await uploadTaskDocument({
          taskId,
          name: file.name,
          url: fileUrl,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          description: `Uploaded directly to task via task repository`,
        });

        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(`"${file.name}" uploaded and attached to task!`);
          router.refresh();
        }
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload document");
      setIsUploading(false);
    }
  };

  // Handle attaching existing document from repository
  const handleAttachExisting = async (docId: string) => {
    if (!docId) return;
    setIsAttaching(true);
    try {
      const res = await assignDocumentToTask({
        documentId: docId,
        taskId,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Document attached to task!");
        setSelectedDocToAttach("");
        router.refresh();
      }
    } catch {
      toast.error("Failed to attach document");
    } finally {
      setIsAttaching(false);
    }
  };

  // Handle disconnecting document from task
  const handleDisconnect = async (docId: string, docName: string) => {
    setIsDisconnectingId(docId);
    try {
      const res = await disconnectDocumentFromTask({
        documentId: docId,
        taskId,
      });

      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Removed "${docName}" from task.`);
        router.refresh();
      }
    } catch {
      toast.error("Failed to remove document from task");
    } finally {
      setIsDisconnectingId(null);
    }
  };

  // Filter available documents so we don't show documents that are already attached
  const unattachedAvailableDocs = availableDocuments.filter(
    (aDoc) => !taskDocuments.some((tDoc) => tDoc.id === aDoc.id)
  );

  return (
    <div className="space-y-6 my-6">
      {/* Upload & Repository Action Box */}
      <Card className="border border-violet-200 dark:border-violet-900/40 bg-gradient-to-br from-violet-500/5 via-background to-violet-500/10 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm">
                <UploadCloud className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">
                  Task Document Repository System
                </CardTitle>
                <CardDescription className="text-xs">
                  Upload new documents directly to this task or select from company repository
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag & Drop Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-800 bg-background/60 p-6 text-center transition-all duration-200 hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 cursor-pointer"
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                <p className="text-sm font-medium text-violet-600">
                  Uploading document to task & repository...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/50 text-violet-600 group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Click or Drag & Drop to Upload Document
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Uploads directly to this task and saves in the Repository (PDF, DOCX, XLSX, Images, ZIP)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 border-violet-300 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-600 hover:text-white"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Select File
                </Button>
              </div>
            )}
          </div>

          {/* Attach Existing Document Dropdown */}
          {unattachedAvailableDocs.length > 0 && (
            <div className="pt-2 border-t flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <Select
                  value={selectedDocToAttach}
                  onValueChange={(val) => {
                    setSelectedDocToAttach(val);
                    handleAttachExisting(val);
                  }}
                  disabled={isAttaching}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="📎 Select and attach an existing document from Repository..." />
                  </SelectTrigger>
                  <SelectContent>
                    {unattachedAvailableDocs.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id} className="text-xs">
                        {doc.document_name} ({formatSize(doc.size)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Documents List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-violet-600" />
            Task Documents ({taskDocuments.length})
          </h4>
        </div>

        {taskDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center bg-muted/20">
            <FileText className="h-10 w-10 text-muted-foreground/50 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">
              No documents attached to this task yet.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Use the upload box above to add task documents.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {taskDocuments.map((doc) => (
              <div
                key={doc.id}
                className="group relative flex items-center justify-between rounded-xl border p-3.5 shadow-sm bg-card transition-all hover:border-violet-400 hover:shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                    {getFileIcon(doc.document_file_mimeType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      title={doc.document_name}
                      className="text-sm font-semibold truncate text-foreground group-hover:text-violet-600 transition-colors"
                    >
                      {doc.document_name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span>{formatSize(doc.size)}</span>
                      {doc.assigned_to_user?.name && (
                        <>
                          <span>•</span>
                          <span className="truncate">{doc.assigned_to_user.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-violet-600 hover:bg-violet-100 hover:text-violet-700 dark:hover:bg-violet-950"
                    title="Download / View Document"
                    onClick={() => window.open(doc.document_file_url, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-500 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950"
                    title="Remove from task"
                    disabled={isDisconnectingId === doc.id}
                    onClick={() => handleDisconnect(doc.id, doc.document_name)}
                  >
                    {isDisconnectingId === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
