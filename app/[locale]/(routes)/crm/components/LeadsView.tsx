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

type CrmData = Awaited<ReturnType<typeof getAllCrmData>>;

interface LeadsViewProps {
  data: any[];
  crmData: CrmData;
}

const LeadsView = ({ data, crmData }: LeadsViewProps) => {
  const { accounts, leadSources, leadStatuses, leadTypes } = crmData;
  const [open, setOpen] = useState(false);
  const t = useTranslations("CrmPage");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between">
          <div>
            <CardTitle>
              <Link href="/crm/leads" className="hover:underline">
                {t("leads.viewTitle")}
              </Link>
            </CardTitle>
          </div>
        </div>
        <Separator />
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
            />
          ))}
      </CardContent>
    </Card>
  );
};

export default LeadsView;
