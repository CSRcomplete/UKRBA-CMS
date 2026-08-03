"use client";

import { useMail } from "@/app/[locale]/(routes)/emails/use-mail";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { addDays, nextSaturday, format, addHours } from "date-fns";

import {
  Archive,
  ArchiveX,
  Clock,
  Forward,
  MoreVertical,
  Reply,
  ReplyAll,
  Trash2,
  Send,
  Paperclip,
  Download,
  Bold,
  Italic,
  List,
  X,
} from "lucide-react";

import {
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Mail } from "@/app/[locale]/(routes)/emails/data";
import { getEmailThread, deleteEmail, sendEmail } from "@/actions/emails/messages";
import { ComposeModal } from "@/app/[locale]/(routes)/emails/components/ComposeModal";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { getUKRBASignature, getUKRBASignatureEditorHtml } from "@/lib/email-signature";

interface MailDisplayProps {
  mail: Mail | null;
  activeAccountId: string | null;
  currentUser?: { name?: string | null; role?: string | null };
}

function AutoResizingIframe({ html }: { html: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const adjustHeight = () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.body) {
          doc.body.style.margin = "0";
          doc.body.style.padding = "0";
          doc.body.style.overflow = "hidden";

          const height = Math.max(
            doc.body.scrollHeight,
            doc.body.offsetHeight,
            doc.documentElement.scrollHeight,
            doc.documentElement.offsetHeight
          );
          if (height > 0) {
            iframe.style.height = `${height + 24}px`;
          }
        }
      } catch {
        // Ignore
      }
    };

    adjustHeight();

    const timer1 = setTimeout(adjustHeight, 150);
    const timer2 = setTimeout(adjustHeight, 600);
    const timer3 = setTimeout(adjustHeight, 1500);

    const handleLoad = () => {
      adjustHeight();
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc) {
          const images = doc.querySelectorAll("img");
          images.forEach((img) => {
            if (!img.complete) {
              img.addEventListener("load", adjustHeight);
              img.addEventListener("error", adjustHeight);
            }
          });
        }
      } catch {
        // Ignore
      }
    };

    iframe.addEventListener("load", handleLoad);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={html}
      sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
      referrerPolicy="no-referrer"
      className="w-full border-0 min-h-[150px] block"
      style={{ height: "auto", overflow: "hidden" }}
      title="Email body"
    />
  );
}

export function MailDisplay({ mail, activeAccountId, currentUser }: MailDisplayProps) {
  const today = new Date();
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const richEditorRef = useRef<{ focus: () => void }>(null);
  const [mailState, setMailState] = useMail();

  const [thread, setThread] = useState<any[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (!mail?.id) {
      setThread([]);
      setReplyText("");
      return;
    }
    let cancelled = false;
    setLoadingThread(true);
    setReplyText("");
    getEmailThread(mail.id)
      .then((data) => {
        if (!cancelled) {
          setThread(data ?? []);
          setLoadingThread(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setThread([]);
          setLoadingThread(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mail?.id, currentUser]);

  const latestEmail = thread.length > 0 ? thread[thread.length - 1] : null;
  const replyTargetEmail =
    latestEmail?.folder === "SENT"
      ? (Array.isArray(latestEmail.toRecipients) ? latestEmail.toRecipients[0]?.email : "")
      : (latestEmail?.fromEmail ?? mail?.fromEmail ?? "");

  const handleFocusReply = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
    setTimeout(() => {
      richEditorRef.current?.focus();
    }, 200);
  };

  const replyFileInputRef = useRef<HTMLInputElement>(null);
  const [replyAttachments, setReplyAttachments] = useState<File[]>([]);

  const handleInlineReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeAccountId || !replyTargetEmail || !latestEmail) return;

    setIsSendingReply(true);
    setSendError(null);

    try {
      const rawSub = latestEmail.subject ?? mail?.subject ?? "No Subject";
      const replySubject = rawSub.toLowerCase().startsWith("re:") ? rawSub : `Re: ${rawSub}`;

      const attachmentPayload = await Promise.all(
        replyAttachments.map(async (file) => {
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

      const newMsg = await sendEmail({
        accountId: activeAccountId,
        to: [replyTargetEmail],
        subject: replySubject,
        body: replyText,
        inReplyTo: latestEmail.rfcMessageId,
        references: latestEmail.rfcMessageId,
        attachments: attachmentPayload,
      });

      setReplyText("");
      setReplyAttachments([]);
      if (newMsg) {
        setThread((prev) => [...prev, newMsg]);
      }
      router.refresh();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setIsSendingReply(false);
    }
  };

  async function handleDelete() {
    if (!mail?.id) return;
    try {
      await deleteEmail(mail.id);
      router.refresh();
    } catch (e) {
      console.error("Failed to delete email", e);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center p-2 gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMailState({ ...mailState, selected: null })}
              title="Back to emails"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Back to list</TooltipContent>
        </Tooltip>

        {mail?.subject && (
          <h2 className="text-sm font-semibold text-foreground truncate max-w-xs md:max-w-md ml-1 mr-auto">
            {mail.subject}
          </h2>
        )}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
                <Archive className="h-4 w-4" />
                <span className="sr-only">Archive</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archive</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail}>
                <ArchiveX className="h-4 w-4" />
                <span className="sr-only">Move to junk</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to junk</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={!mail}
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Move to trash</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Move to trash</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Tooltip>
            <Popover>
              <PopoverTrigger asChild>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={!mail}>
                    <Clock className="h-4 w-4" />
                    <span className="sr-only">Snooze</span>
                  </Button>
                </TooltipTrigger>
              </PopoverTrigger>
              <PopoverContent className="flex w-[535px] p-0">
                <div className="flex flex-col gap-2 border-r px-2 py-4">
                  <div className="px-4 text-sm font-medium">Snooze until</div>
                  <div className="grid min-w-[250px] gap-1">
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Later today{" "}
                      <span className="ml-auto text-muted-foreground">
                        {format(addHours(today, 4), "E, h:m b")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Tomorrow
                      <span className="ml-auto text-muted-foreground">
                        {format(addDays(today, 1), "E, h:m b")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      This weekend
                      <span className="ml-auto text-muted-foreground">
                        {format(nextSaturday(today), "E, h:m b")}
                      </span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="justify-start font-normal"
                    >
                      Next week
                      <span className="ml-auto text-muted-foreground">
                        {format(addDays(today, 7), "E, h:m b")}
                      </span>
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <Calendar />
                </div>
              </PopoverContent>
            </Popover>
            <TooltipContent>Snooze</TooltipContent>
          </Tooltip>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail} onClick={handleFocusReply}>
                <Reply className="h-4 w-4" />
                <span className="sr-only">Reply</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" disabled={!mail} onClick={handleFocusReply}>
                <ReplyAll className="h-4 w-4" />
                <span className="sr-only">Reply all</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reply all</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <ComposeModal
                accountId={activeAccountId ?? ""}
                mode="forward"
                replyTo={latestEmail ? (latestEmail as unknown as Mail) : undefined}
                trigger={
                  <Button variant="ghost" size="icon" disabled={!mail}>
                    <Forward className="h-4 w-4" />
                    <span className="sr-only">Forward</span>
                  </Button>
                }
              />
            </TooltipTrigger>
            <TooltipContent>Forward</TooltipContent>
          </Tooltip>
        </div>
        <Separator orientation="vertical" className="mx-2 h-6" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={!mail}>
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">More</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Mark as unread</DropdownMenuItem>
            <DropdownMenuItem>Star thread</DropdownMenuItem>
            <DropdownMenuItem>Add label</DropdownMenuItem>
            <DropdownMenuItem>Mute thread</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Separator />

      {mail ? (
        <div ref={scrollContainerRef} className="flex flex-1 flex-col overflow-y-auto">
          {/* Conversation Thread History */}
          <div className="space-y-6 p-4">
            {loadingThread && thread.length === 0 && (
              <div className="p-4 text-xs text-muted-foreground text-center">Loading conversation thread...</div>
            )}
            {thread.map((msg, index) => {
              const sName = msg.fromName ?? msg.fromEmail ?? "?";
              const sInitials = sName
                .split(" ")
                .map((c: string) => c[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <div key={msg.id || index} className="rounded-lg border bg-card p-4 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage alt={sName} />
                        <AvatarFallback>{sInitials}</AvatarFallback>
                      </Avatar>
                      <div className="grid gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{sName}</span>
                          <Badge variant={msg.folder === "SENT" ? "secondary" : "outline"} className="text-[10px] py-0 h-4">
                            {msg.folder === "SENT" ? "Sent by You" : "Received"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">From:</span> {msg.fromEmail ?? ""}
                        </div>
                        {Array.isArray(msg.toRecipients) && msg.toRecipients.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">To:</span>{" "}
                            {(msg.toRecipients as { name?: string; email: string }[])
                              .map((r) => r.name || r.email).join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                    {msg.sentAt && (
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(msg.sentAt), "PPpp")}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="text-sm leading-relaxed">
                    {msg.bodyHtml ? (
                      <AutoResizingIframe html={msg.bodyHtml} />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans text-sm">
                        {msg.bodyText ?? "(No content)"}
                      </pre>
                    )}

                    {/* Render Attachments if present */}
                    {Array.isArray((msg as any).attachments) && (msg as any).attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t space-y-1.5">
                        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          <Paperclip className="h-3.5 w-3.5" /> Attachments ({(msg as any).attachments.length})
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {(msg as any).attachments.map((att: any, attIdx: number) => {
                            const isImage =
                              att.mimeType?.startsWith("image/") ||
                              /\.(png|jpe?g|gif|webp)$/i.test(att.filename || "");
                            return (
                              <div key={attIdx} className="flex flex-col gap-1.5 rounded-lg border p-2 bg-muted/20">
                                {isImage && att.storageUrl && (
                                  <a href={att.storageUrl} target="_blank" rel="noreferrer" className="overflow-hidden rounded-md border bg-background">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={att.storageUrl} alt={att.filename} className="max-h-36 max-w-[200px] object-cover rounded-md" />
                                  </a>
                                )}
                                <a
                                  href={att.storageUrl || "#"}
                                  download={att.filename}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-medium hover:underline text-primary"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  <span className="truncate max-w-[150px]">{att.filename}</span>
                                  <span className="text-[10px] text-muted-foreground">({Math.round((att.size || 0) / 1024)} KB)</span>
                                </a>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <Separator />

          {/* Interactive Bottom Reply Box */}
          <div className="p-4 bg-background">
            <form onSubmit={handleInlineReply} className="grid gap-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
                <span className="font-medium">Reply Message</span>
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Official UK SME Logo Signature attached
                </span>
              </div>

              {/* Real-Time Visual WYSIWYG Rich Text Editor */}
              <RichTextEditor
                ref={richEditorRef}
                value={replyText}
                onChange={setReplyText}
                placeholder={`Reply to ${replyTargetEmail || "sender"}...`}
                minHeight="120px"
                onAttachFile={() => replyFileInputRef.current?.click()}
              />
              {/* Attachments for Inline Reply */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={replyFileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      const files = Array.from(e.target.files);
                      setReplyAttachments((prev) => [...prev, ...files]);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => replyFileInputRef.current?.click()}
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  Attach Files ({replyAttachments.length})
                </Button>

                {replyAttachments.map((file, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 rounded-md border bg-muted/60 px-2 py-0.5 text-[11px]">
                    <span className="truncate max-w-[120px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => setReplyAttachments((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              {sendError && (
                <p className="text-xs text-destructive">{sendError}</p>
              )}
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="mute"
                  className="flex items-center gap-2 text-xs font-normal text-muted-foreground"
                >
                  <Switch id="mute" aria-label="Mute thread" /> Mute this thread
                </Label>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSendingReply || !replyText.trim() || !activeAccountId}
                  className="gap-1.5 px-4"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isSendingReply ? "Sending..." : "Send Reply"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground">
          No message selected
        </div>
      )}
    </div>
  );
}
