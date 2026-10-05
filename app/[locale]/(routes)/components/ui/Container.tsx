"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import React from "react";

interface ContainerProps {
  title: string;
  description: string;
  visibility?: string;
  children: React.ReactNode;
}

const Container = ({ children }: ContainerProps) => {
  const pathname = usePathname();
  const withoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  const isDashboard = withoutLocale === "/" || withoutLocale === "";

  return (
    <div className="flex flex-col flex-1 h-full w-full">
      {!isDashboard && (
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      )}
      <Separator className="mb-4" />
      <div className="flex-1 min-h-0 w-full">
        {children}
      </div>
    </div>
  );
};

export default Container;
