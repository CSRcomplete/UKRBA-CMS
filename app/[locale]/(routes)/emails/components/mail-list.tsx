"use client";

import { formatDistanceToNow } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
    <div className="h-full w-full min-w-0 overflow-x-hidden overflow-y-auto">
      <div className="flex flex-col border-t">
        {items.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No emails found
          </div>
        ) : (
          items.map((item) => {
            let sender = item.fromName || item.fromEmail || "Unknown";
            if (item.folder === "SENT" && Array.isArray(item.toRecipients) && item.toRecipients.length > 0) {
              const firstTo = item.toRecipients[0];
              sender = `To: ${firstTo.name || firstTo.email}`;
            }
            const snippet = (item.bodyText || "")
              .slice(0, 400)
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 160);
            const date = item.sentAt
              ? formatDistanceToNow(new Date(item.sentAt), { addSuffix: true })
              : "";

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
                  "flex w-full min-w-0 items-center gap-3 border-b px-4 py-3 text-sm cursor-pointer transition-colors hover:bg-accent/50",
                  !item.isRead
                    ? "bg-background font-semibold text-foreground"
                    : "bg-muted/20 text-muted-foreground font-normal"
                )}
              >
                {/* Unread status indicator dot */}
                <div className="flex items-center justify-center w-3 h-3 shrink-0">
                  {!item.isRead ? (
                    <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-500" />
                  ) : null}
                </div>

                {/* Mobile: stacked sender/date + subject. Desktop: single row */}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:flex-row md:items-center md:gap-3">
                  <div className="flex min-w-0 items-center justify-between gap-2 md:w-44 md:shrink-0">
                    <span className="truncate font-medium text-foreground">{sender}</span>
                    <span className="shrink-0 text-xs text-muted-foreground md:hidden">
                      {date}
                    </span>
                  </div>

                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="max-w-full truncate font-medium text-foreground md:max-w-[60%] md:shrink-0">
                      {item.subject || "(no subject)"}
                    </span>
                    {snippet && (
                      <span className="hidden min-w-0 flex-1 truncate text-xs text-muted-foreground font-normal md:inline">
                        - {snippet}
                      </span>
                    )}
                  </div>
                </div>

                <div className="hidden w-28 shrink-0 text-right text-xs text-muted-foreground md:block">
                  {date}
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
    </div>
  );
}
