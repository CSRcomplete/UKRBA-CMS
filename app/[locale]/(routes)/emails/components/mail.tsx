"use client";
import * as React from "react";
import { Inbox, PenBox, Search, Send, RefreshCw, FileText, Trash2 } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { EmailFolder } from "@prisma/client";

import { AccountSwitcher } from "@/app/[locale]/(routes)/emails/components/account-switcher";
import { ComposeModal } from "@/app/[locale]/(routes)/emails/components/ComposeModal";
import { MailDisplay } from "@/app/[locale]/(routes)/emails/components/mail-display";
import { MailList } from "@/app/[locale]/(routes)/emails/components/mail-list";
import { Nav } from "@/app/[locale]/(routes)/emails/components/nav";
import type { ConnectedAccount, Mail } from "@/app/[locale]/(routes)/emails/data";
import { useMail } from "@/app/[locale]/(routes)/emails/use-mail";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import { triggerSync } from "@/actions/emails/sync";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

interface MailProps {
  accounts: ConnectedAccount[];
  mails: Mail[];
  activeAccountId: string | null;
  activeFolder: "INBOX" | "SENT";
  page: number;
  totalPages: number;
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
  currentUser?: { name?: string | null; role?: string | null };
}

export function MailComponent({
  accounts,
  mails,
  activeAccountId,
  activeFolder,
  page,
  totalPages,
  defaultLayout = [20, 35, 45],
  defaultCollapsed = false,
  navCollapsedSize,
  currentUser,
}: MailProps) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const [mail] = useMail();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isSyncing, setIsSyncing] = React.useState(false);

  async function handleSync() {
    if (!activeAccountId) return;
    setIsSyncing(true);
    try {
      await triggerSync(activeAccountId);
      router.refresh();
    } catch {
      // Ignore
    } finally {
      setIsSyncing(false);
    }
  }

  function folderHref(folder: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("folder", folder);
    p.delete("page");
    return `?${p.toString()}`;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        orientation="horizontal"
        onLayoutChange={(layout) => {
          // Convert v4 layout object to array format for storage
          const layoutArray = Object.values(layout);
          document.cookie = `react-resizable-panels:layout=${JSON.stringify(
            layoutArray
          )}`;
        }}
        className="h-full flex-row"
      >
        <ResizablePanel
          defaultSize={`${defaultLayout[0]}%`}
          collapsedSize={`${navCollapsedSize}%`}
          collapsible={true}
          minSize="18%"
          maxSize="20%"
          onResize={(panelSize) => {
            const collapsed = panelSize.asPercentage <= navCollapsedSize;
            if (collapsed !== isCollapsed) {
              setIsCollapsed(collapsed);
              document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
                collapsed
              )}`;
            }
          }}
          className={cn(
            isCollapsed && "transition-all duration-300 ease-in-out"
          )}
        >
          <div className="flex items-center p-2">
            <div
              className="w-full"
              // className={cn("w-full flex-1", isCollapsed ? "w-full" : "w-[80%]")}
            >
              <AccountSwitcher
                isCollapsed={isCollapsed}
                accounts={accounts}
                activeAccountId={activeAccountId}
              />
            </div>
          </div>
          <Separator />
          {activeAccountId && !isCollapsed && (
            <div className="p-2">
              <ComposeModal accountId={activeAccountId} currentUser={currentUser} />
            </div>
          )}
          <div className={cn(isCollapsed ? "block" : "hidden")}>
            <Nav
              isCollapsed={isCollapsed}
              links={[
                {
                  title: "Compose",
                  icon: PenBox,
                  variant: "ghost",
                  href: "#",
                },
              ]}
            />
          </div>
          <Nav
            isCollapsed={isCollapsed}
            links={[
              {
                title: "Inbox",
                icon: Inbox,
                variant: activeFolder === "INBOX" ? "default" : "ghost",
                href: folderHref("INBOX"),
              },
              {
                title: "Sent Items",
                icon: Send,
                variant: activeFolder === "SENT" ? "default" : "ghost",
                href: folderHref("SENT"),
              },
              {
                title: "Drafts",
                icon: FileText,
                variant: activeFolder === "DRAFTS" ? "default" : "ghost",
                href: folderHref("DRAFTS"),
              },
              {
                title: "Deleted Items",
                icon: Trash2,
                variant: activeFolder === "TRASH" ? "default" : "ghost",
                href: folderHref("TRASH"),
              },
            ]}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={`${defaultLayout[1]}%`} minSize="30%">
          <Tabs defaultValue="all">
            <div className="flex items-center px-4 py-2">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">
                  {activeFolder === "SENT"
                    ? "Sent Items"
                    : activeFolder === "DRAFTS"
                      ? "Drafts"
                      : activeFolder === "TRASH"
                        ? "Deleted Items"
                        : "Inbox"}
                </h1>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={isSyncing || !activeAccountId}
                  onClick={handleSync}
                  title="Sync Emails Now"
                >
                  <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
                </Button>
              </div>
              <TabsList className="ml-auto">
                <TabsTrigger
                  value="all"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  All mail
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="text-zinc-600 dark:text-zinc-200"
                >
                  Unread
                </TabsTrigger>
              </TabsList>
            </div>
            <Separator />
            <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <form>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search" className="pl-8" />
                </div>
              </form>
            </div>
            <TabsContent value="all" className="m-0">
              <MailList items={mails} page={page} totalPages={totalPages} />
            </TabsContent>
            <TabsContent value="unread" className="m-0">
              <MailList items={mails.filter((item) => !item.isRead)} page={page} totalPages={totalPages} />
            </TabsContent>
          </Tabs>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={`${defaultLayout[2]}%`} minSize="30%">
          <MailDisplay
            mail={mails.find((item) => item.id === mail.selected) || null}
            activeAccountId={activeAccountId}
            currentUser={currentUser}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}
