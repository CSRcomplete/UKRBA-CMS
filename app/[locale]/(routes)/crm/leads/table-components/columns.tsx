"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

import { Lead } from "../table-data/schema";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { SALES_STATUS_LABELS } from "@/lib/sales-status";
import { extractPostcodeArea } from "@/lib/postcode";
import moment from "moment";

type ConfigItem = { id: string; name: string };

export const createColumns = (
  leadSources: ConfigItem[],
  leadStatuses: ConfigItem[],
  leadTypes: ConfigItem[],
): ColumnDef<Lead>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last update" />
    ),
    cell: ({ row }) => (
      <div className="w-[80px]">
        {moment(row.getValue("updatedAt")).format("YY-MM-DD")}
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "assigned_to_user",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Assigned to" />
    ),

    cell: ({ row }) => (
      <div className="w-[150px]">
        {
          //@ts-ignore
          //TODO: fix this
          row.getValue("assigned_to_user")?.name ?? "Unassigned"
        }
      </div>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "company",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Company" />
    ),

    cell: ({ row }) => (
      <Link href={`/crm/leads/${row.original.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">
        <div>
          {row.getValue("company") || "Unassigned"}
        </div>
      </Link>
    ),
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "firstName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),

    cell: ({ row }) => (
      <Link href={`/crm/leads/${row.original.id}`} className="font-semibold text-primary hover:underline" data-testid="lead-row-name">
        <div>
          {[row.original.firstName, row.original.lastName].filter(Boolean).join(" ") || "Unnamed Lead"}
        </div>
      </Link>
    ),
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="E-mail" />
    ),

    cell: ({ row }) => (
      <Link href={`/crm/leads/${row.original.id}`} className="w-[150px] text-muted-foreground hover:text-foreground transition-colors block truncate">
        <div>{row.getValue("email") || "-"}</div>
      </Link>
    ),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "phone",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),

    cell: ({ row }) => (
      <Link href={`/crm/leads/${row.original.id}`} className="w-[150px] text-muted-foreground hover:text-foreground transition-colors block">
        <div>{row.getValue("phone") || "-"}</div>
      </Link>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "postcode",
    accessorFn: (row: any) => extractPostcodeArea(row.postcode),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Postcode" />
    ),
    cell: ({ row }) => <div className="w-[100px]">{(row.original as any).postcode || "-"}</div>,
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    enableSorting: true,
    enableHiding: true,
  },
  {
    accessorKey: "lead_type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => {
      //@ts-ignore
      const typeId = row.original.lead_type_id;
      const type = leadTypes.find((t) => t.id === typeId);
      return <div className="w-[120px]">{type?.name ?? "General Enquiry"}</div>;
    },
    enableSorting: true,
    enableHiding: true,
  },
  {
    id: "lead_status",
    accessorFn: (row: any) => row.lead_status_id ?? "",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      //@ts-ignore
      const statusId = row.original.lead_status_id;
      const status = leadStatuses.find((s) => s.id === statusId);
      return <div className="w-[130px]">{status?.name ?? "New Lead"}</div>;
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    enableSorting: true,
    enableHiding: true,
  },
  {
    id: "lead_source",
    accessorFn: (row: any) => row.lead_source_id ?? "",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Lead Source" />
    ),
    cell: ({ row }) => {
      //@ts-ignore
      const sourceId = row.original.lead_source_id;
      const source = leadSources.find((s) => s.id === sourceId);
      return <div className="w-[130px]">{source?.name ?? "—"}</div>;
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    enableSorting: true,
    enableHiding: true,
  },
  {
    id: "sales_status",
    accessorFn: (row: any) => row.sales_status ?? "",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sales Status" />
    ),
    cell: ({ row }) => {
      //@ts-ignore
      const value = row.original.sales_status as keyof typeof SALES_STATUS_LABELS | null;
      if (!value) return <span className="text-muted-foreground text-xs">Not set</span>;
      return <Badge variant="secondary">{SALES_STATUS_LABELS[value]}</Badge>;
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
    enableSorting: true,
    enableHiding: true,
  },
  {
    id: "nextAction",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Next Action" />
    ),
    cell: ({ row }) => {
      const nextAction = (row.original as any).nextAction;
      if (!nextAction) return <span className="text-muted-foreground text-xs">—</span>;
      return (
        <div className="flex flex-col text-xs max-w-[150px]">
          <span className="font-semibold truncate text-primary hover:underline" title={nextAction.title}>
            {nextAction.title}
          </span>
          <span className="text-muted-foreground text-[10px]">
            {moment(nextAction.dueDateAt).format("YY-MM-DD")}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions
        row={row}
        leadSources={leadSources}
        leadStatuses={leadStatuses}
        leadTypes={leadTypes}
      />
    ),
  },
];
