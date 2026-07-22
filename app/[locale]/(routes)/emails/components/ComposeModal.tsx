"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendEmail, saveDraft, getEmailTemplates, type EmailTemplate } from "@/actions/emails/messages";
import { useRouter } from "next/navigation";
import type { Mail } from "@/app/[locale]/(routes)/emails/data";
import { Paperclip, Save, FileText, X } from "lucide-react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { getUKRBASignature, getUKRBASignatureHtml, getUKRBASignatureEditorHtml } from "@/lib/email-signature";

type Mode = "new" | "reply" | "forward";

type Props = {
  accountId: string;
  mode?: Mode;
  replyTo?: Mail;
  trigger?: React.ReactNode;
  currentUser?: { name?: string | null; role?: string | null };
};

export function ComposeModal({
  accountId,
  mode = "new",
  replyTo,
  trigger,
  currentUser,
}: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  useEffect(() => {
    getEmailTemplates()
      .then(setTemplates)
      .catch(() => {});
  }, []);

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (v) {
      setError(null);
      setAttachments([]);
      setSelectedTemplateId("");
      setTo(mode === "reply" ? replyTo?.fromEmail ?? "" : "");
      setCc("");
      const cleanSub = replyTo?.subject ?? "";
      if (mode === "reply") {
        setSubject(cleanSub.toLowerCase().startsWith("re:") ? cleanSub : `Re: ${cleanSub}`);
      } else if (mode === "forward") {
        setSubject(cleanSub.toLowerCase().startsWith("fwd:") ? cleanSub : `Fwd: ${cleanSub}`);
      } else {
        setSubject("");
      }

      const sigHtml = getUKRBASignatureEditorHtml(currentUser);
      setBody(
        mode === "reply" || mode === "forward"
          ? `${sigHtml}<div><br></div><div><br></div><div>--- Original Message ---</div><div>${replyTo?.bodyText ?? ""}</div>`
          : sigHtml
      );
    }
  };

  const handleApplyTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return;

    if (!subject) setSubject(tmpl.subject);
    const sig = getUKRBASignature(currentUser);
    setBody(`${tmpl.body}\n${sig}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setAttachments((prev) => [...prev, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const insertFormat = (prefix: string, suffix: string = "", defaultText: string = "text") => {
    setBody((prev) => {
      const targetText = `${prefix}${defaultText}${suffix}`;
      if (!prev.trim()) return targetText;
      return `${targetText}\n${prev}`;
    });
  };

  async function handleSaveDraft() {
    if (!accountId) return;
    setSavingDraft(true);
    setError(null);
    try {
      await saveDraft({
        accountId,
        to: to.split(",").map((e) => e.trim()).filter(Boolean),
        cc: cc.split(",").map((e) => e.trim()).filter(Boolean),
        subject,
        body,
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      // Convert attached files to base64
      const attachmentPayload = await Promise.all(
        attachments.map(async (file) => {
          return new Promise<{ filename: string; content: string; contentType: string; size: number }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const res = reader.result as string;
              const base64 = res.split(",")[1] || "";
              resolve({
                filename: file.name,
                content: base64,
                contentType: file.type || "application/octet-stream",
                size: file.size,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        })
      );

      await sendEmail({
        accountId,
        to: to.split(",").map((e) => e.trim()).filter(Boolean),
        cc: cc.split(",").map((e) => e.trim()).filter(Boolean),
        subject,
        body,
        inReplyTo: mode === "reply" ? replyTo?.rfcMessageId : undefined,
        references: mode === "reply" ? replyTo?.rfcMessageId : undefined,
        attachments: attachmentPayload,
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm">Compose</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{mode === "reply" ? "Reply" : mode === "forward" ? "Forward" : "New Email"}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Template Selector */}
          {templates.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Insert Standard Email Template
              </Label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleApplyTemplate(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Select a UKRBA template...</option>
                {templates.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">CC</Label>
              <Input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="cc@example.com" className="h-8 text-xs" />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject" className="h-8 text-xs font-medium" />
          </div>

          {/* Visual WYSIWYG Rich Text Editor */}
          <div className="space-y-1">
            <Label className="text-xs">Message</Label>
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder="Type your email message here..."
              minHeight="180px"
              onAttachFile={() => fileInputRef.current?.click()}
            />
          </div>

          {/* Attachments Section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1">
                <Paperclip className="h-3.5 w-3.5" /> Attachments ({attachments.length})
              </Label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="h-3 w-3" /> Attach Files
              </Button>
            </div>
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {attachments.map((file, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 rounded-md border bg-muted/50 px-2 py-0.5 text-[11px]">
                    <span className="truncate max-w-[140px]">{file.name}</span>
                    <button type="button" onClick={() => removeAttachment(idx)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              disabled={savingDraft || sending}
              className="gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              {savingDraft ? "Saving..." : "Save Draft"}
            </Button>

            <Button onClick={handleSend} disabled={sending || savingDraft} size="sm" className="ml-auto px-6">
              {sending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
