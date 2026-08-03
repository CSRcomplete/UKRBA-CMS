"use client";

import { formatDistanceToNow } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Mail } from "@/app/[locale]/(routes)/emails/data";
import { useMail } from "@/app/[locale]/(routes)/emails/use-mail";

interface MailListProps {
  items: Mail[];
  page: number;
  totalPages: number;
}

export function MailList({ items, page, totalPages }: MailListProps) {
  const [mail, setMail] = useMail();
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(toPage: number) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("page", String(toPage));
    router.push(`?${p.toString()}`);
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col border-t">
        {items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No emails found
          </div>
        ) : (
          items.map((item) => {
            const sender = item.fromName || item.fromEmail || "Unknown";
            const snippet = item.bodyText?.replace(/\s+/g, " ").trim() || "";

            return (
              <div
                key={item.id}
                onClick={() =>
                  setMail({
                    ...mail,
                    selected: item.id,
                  })
                }
                className={cn(
                  "flex items-center gap-3 border-b px-4 py-3 text-sm cursor-pointer transition-colors hover:bg-accent/50",
                  !item.isRead
                    ? "bg-background font-semibold text-foreground"
                    : "bg-muted/20 text-muted-foreground font-normal"
                )}
              >
                {/* Unread status indicator dot */}
                <div className="flex items-center justify-center w-3 h-3">
                  {!item.isRead ? (
                    <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500" />
                  ) : null}
                </div>

                {/* Sender Name / Address */}
                <div className="w-44 shrink-0 truncate font-medium text-foreground">
                  {sender}
                </div>

                {/* Subject & Preview Snippet */}
                <div className="flex flex-1 items-center gap-2 overflow-hidden truncate">
                  <span className="shrink-0 font-medium text-foreground">
                    {item.subject || "(no subject)"}
                  </span>
                  {snippet && (
                    <span className="truncate text-xs text-muted-foreground font-normal">
                      - {snippet}
                    </span>
                  )}
                </div>

                {/* Sent / Received Date */}
                <div className="w-28 shrink-0 text-right text-xs text-muted-foreground">
                  {item.sentAt
                    ? formatDistanceToNow(new Date(item.sentAt), {
                        addSuffix: true,
                      })
                    : ""}
                </div>
              </div>
            );
          })
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => navigate(page - 1)}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => navigate(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </ScrollArea>
  );
}
