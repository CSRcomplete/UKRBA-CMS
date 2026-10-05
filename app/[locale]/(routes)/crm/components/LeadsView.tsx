"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { NewLeadForm } from "../leads/components/NewLeadForm";
import { LeadDataTable } from "../leads/table-components/data-table";

import type { getAllCrmData } from "@/actions/crm/get-crm-data";
import type { PostcodeOption } from "@/actions/crm/get-postcode-options";

type CrmData = Awaited<ReturnType<typeof getAllCrmData>>;

interface LeadsViewProps {
  data: any[];
  crmData: CrmData;
  postcodeOptions?: PostcodeOption[];
  title?: string;
  backHref?: string;
}

import { Upload } from "lucide-react";

const LeadsView = ({ data, crmData, postcodeOptions = [], title, backHref }: LeadsViewProps) => {
  const { accounts, leadSources, leadStatuses, leadTypes } = crmData;
  const [open, setOpen] = useState(false);
  const t = useTranslations("CrmPage");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              <Link href={backHref ?? "/crm/leads"} className="hover:underline">
                {title ?? t("leads.viewTitle")}
              </Link>
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/crm/leads/upload">
              <Button size="sm" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span>Upload Leads</span>
              </Button>
            </Link>
          </div>
        </div>
        <Separator className="mt-3" />
      </CardHeader>
      <CardContent>
        {!data ||
          (data.length === 0 ? (
            t("leads.empty")
          ) : (
            <LeadDataTable
              data={data}
              columns={[]}
              leadSources={leadSources}
              leadStatuses={leadStatuses}
              leadTypes={leadTypes}
              postcodeOptions={postcodeOptions}
            />
          ))}
      </CardContent>
    </Card>
  );
};

export default LeadsView;
