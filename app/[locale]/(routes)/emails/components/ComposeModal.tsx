"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendEmail } from "@/actions/emails/messages";
import { useRouter } from "next/navigation";
import type { Mail } from "@/app/[locale]/(routes)/emails/data";

import { getUKRBASignature } from "@/lib/email-signature";

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
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleOpenChange = (v: boolean) => {
    setOpen(v);
    if (v) {
      setError(null);
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

      const sig = getUKRBASignature(currentUser);
      setBody(
        mode === "reply" || mode === "forward"
          ? `${sig}\n\n--- Original Message ---\n${replyTo?.bodyText ?? ""}`
          : sig
      );
    }
  };

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      await sendEmail({
        accountId,
        to: to.split(",").map((e) => e.trim()).filter(Boolean),
        cc: cc.split(",").map((e) => e.trim()).filter(Boolean),
        subject,
        body,
        inReplyTo: mode === "reply" ? replyTo?.rfcMessageId : undefined,
        references:
          mode === "reply" ? replyTo?.rfcMessageId : undefined,
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "reply" ? "Reply" : mode === "forward" ? "Forward" : "New Email"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>To</Label>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" />
          </div>
          <div className="space-y-1">
            <Label>CC</Label>
            <Input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="cc@example.com" />
          </div>
          <div className="space-y-1">
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleSend} disabled={sending} className="w-full">
            {sending ? "Sending…" : "Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
