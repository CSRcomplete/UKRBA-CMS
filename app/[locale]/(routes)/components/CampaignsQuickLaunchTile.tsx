"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Megaphone, FileText, Users, ListChecks, ArrowRight } from "lucide-react";

const OPTIONS = [
  {
    title: "All Campaigns",
    description: "View, launch and monitor your email campaigns.",
    href: "/campaigns",
    icon: Megaphone,
    color: "pink",
  },
  {
    title: "Templates",
    description: "Reusable email templates for campaign steps.",
    href: "/campaigns/templates",
    icon: FileText,
    color: "orange",
  },
  {
    title: "Targets",
    description: "Prospect contacts you can send campaigns to.",
    href: "/campaigns/targets",
    icon: Users,
    color: "sky",
  },
  {
    title: "Target Lists",
    description: "Grouped lists of targets for campaign audiences.",
    href: "/campaigns/target-lists",
    icon: ListChecks,
    color: "lime",
  },
] as const;

const ICON_CLASSES: Record<string, string> = {
  pink: "bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400",
  orange: "bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400",
  sky: "bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400",
  lime: "bg-lime-50 dark:bg-lime-950/30 text-lime-600 dark:text-lime-400",
};

const HOVER_TEXT_CLASSES: Record<string, string> = {
  pink: "group-hover:text-pink-600",
  orange: "group-hover:text-orange-600",
  sky: "group-hover:text-sky-600",
  lime: "group-hover:text-lime-600",
};

export function CampaignsQuickLaunchTile() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-foreground/25 text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-pink-50 dark:bg-pink-950/30 text-pink-600 dark:text-pink-400 shadow-none transition-transform group-hover:scale-110">
            <Megaphone className="h-6 w-6" />
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-pink-600" />
        </div>
        <div className="mt-4 space-y-1">
          <h3 className="text-lg font-bold text-foreground group-hover:text-pink-600 transition-colors">
            Campaigns
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            Email campaigns, templates, prospect targets & target lists.
          </p>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Campaigns</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {OPTIONS.map((option) => (
              <Link
                key={option.href}
                href={option.href}
                onClick={() => setOpen(false)}
                className="group relative overflow-hidden rounded-xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-foreground/30"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg shadow-none transition-transform group-hover:scale-110 ${ICON_CLASSES[option.color]}`}
                  >
                    <option.icon className="h-5.5 w-5.5" />
                  </div>
                  <ArrowRight className={`h-4.5 w-4.5 text-muted-foreground transition-transform group-hover:translate-x-1 ${HOVER_TEXT_CLASSES[option.color]}`} />
                </div>
                <div className="mt-3 space-y-1">
                  <h4 className={`text-base font-bold text-foreground transition-colors ${HOVER_TEXT_CLASSES[option.color]}`}>
                    {option.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {option.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
