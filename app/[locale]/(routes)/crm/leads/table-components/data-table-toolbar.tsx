"use client";

import { Cross2Icon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTableViewOptions } from "./data-table-view-options";

import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { SALES_STATUS_LABELS } from "@/lib/sales-status";

type ConfigItem = { id: string; name: string };
type PostcodeOption = { postcode_area: string; area_name: string | null };

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  leadSources?: ConfigItem[];
  leadStatuses?: ConfigItem[];
  postcodeOptions?: PostcodeOption[];
}

const salesStatusOptions = Object.entries(SALES_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export function DataTableToolbar<TData>({
  table,
  leadSources = [],
  leadStatuses = [],
  postcodeOptions = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <Input
          placeholder="Filter by company..."
          value={(table.getColumn("company")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("company")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[200px]"
        />
        {table.getColumn("postcode") && (
          <DataTableFacetedFilter
            column={table.getColumn("postcode")}
            title="Postcode"
            options={postcodeOptions.map((p) => ({
              value: p.postcode_area,
              label: p.area_name ? `${p.postcode_area} — ${p.area_name}` : p.postcode_area,
            }))}
          />
        )}
        {table.getColumn("lead_status") && (
          <DataTableFacetedFilter
            column={table.getColumn("lead_status")}
            title="Status"
            options={leadStatuses.map((s) => ({ value: s.id, label: s.name }))}
          />
        )}
        {table.getColumn("lead_source") && (
          <DataTableFacetedFilter
            column={table.getColumn("lead_source")}
            title="Lead Source"
            options={leadSources.map((s) => ({ value: s.id, label: s.name }))}
          />
        )}
        {table.getColumn("sales_status") && (
          <DataTableFacetedFilter
            column={table.getColumn("sales_status")}
            title="Sales Status"
            options={salesStatusOptions}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  );
}
