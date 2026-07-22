"use client";

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

import { getUKRBASignature } from "@/lib/email-signature";

interface MailDisplayProps {
  mail: Mail | null;
  activeAccountId: string | null;
  currentUser?: { name?: string | null; role?: string | null };
}

export function MailDisplay({ mail, activeAccountId, currentUser }: MailDisplayProps) {
  const today = new Date();
  const router = useRouter();
  const inlineReplyRef = useRef<HTMLTextAreaElement>(null);

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
    setReplyText(getUKRBASignature(currentUser));
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
    if (inlineReplyRef.current) {
      inlineReplyRef.current.scrollIntoView({ behavior: "smooth" });
      inlineReplyRef.current.focus();
    }
  };

  const handleInlineReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeAccountId || !replyTargetEmail || !latestEmail) return;

    setIsSendingReply(true);
    setSendError(null);

    try {
      const rawSub = latestEmail.subject ?? mail?.subject ?? "No Subject";
      const replySubject = rawSub.toLowerCase().startsWith("re:") ? rawSub : `Re: ${rawSub}`;

      const newMsg = await sendEmail({
        accountId: activeAccountId,
        to: [replyTargetEmail],
        subject: replySubject,
        body: replyText,
        inReplyTo: latestEmail.rfcMessageId,
        references: latestEmail.rfcMessageId,
      });

      setReplyText(getUKRBASignature(currentUser));
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
      <div className="flex items-center p-2">
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
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Conversation Thread History */}
          <div className="flex-1 overflow-y-auto space-y-6 p-4">
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
                      <iframe
                        srcDoc={msg.bodyHtml}
                        sandbox="allow-popups allow-popups-to-escape-sandbox"
                        referrerPolicy="no-referrer"
                        className="w-full border-0 min-h-[150px]"
                        style={{ height: "auto" }}
                        title="Email body"
                      />
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
                        <div className="flex flex-wrap gap-2">
                          {(msg as any).attachments.map((att: any, attIdx: number) => (
                            <a
                              key={attIdx}
                              href={att.storageUrl || "#"}
                              download={att.filename}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-md border bg-muted/40 px-2.5 py-1 text-xs hover:bg-muted font-medium transition-colors"
                            >
                              <Download className="h-3.5 w-3.5 text-primary" />
                              <span>{att.filename}</span>
                              <span className="text-[10px] text-muted-foreground">({Math.round((att.size || 0) / 1024)} KB)</span>
                            </a>
                          ))}
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

              {/* Formatting Toolbar */}
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-md border">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setReplyText((prev) => prev ? `**bold text**\n${prev}` : "**bold text**")}
                  title="Bold"
                >
                  <Bold className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setReplyText((prev) => prev ? `*italic text*\n${prev}` : "*italic text*")}
                  title="Italic"
                >
                  <Italic className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setReplyText((prev) => prev ? `- bullet item\n${prev}` : "- bullet item")}
                  title="Bullet List"
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>

              <Textarea
                ref={inlineReplyRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="min-h-[100px] p-3 text-sm resize-y"
                placeholder={`Reply to ${replyTargetEmail || "sender"}...`}
              />
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
