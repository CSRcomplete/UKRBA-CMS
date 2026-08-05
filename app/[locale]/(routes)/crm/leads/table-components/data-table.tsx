"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DataTablePagination } from "./data-table-pagination";
import { DataTableToolbar } from "./data-table-toolbar";
import { PanelTopClose, PanelTopOpen } from "lucide-react";
import { createColumns } from "./columns";
import { Button } from "@/components/ui/button";
import AlertModal from "@/components/modals/alert-modal";
import { useSession } from "@/lib/auth-client";
import { bulkDeleteLeads } from "@/actions/crm/leads/bulk-delete-leads";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type ConfigItem = { id: string; name: string };

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  leadSources?: ConfigItem[];
  leadStatuses?: ConfigItem[];
  leadTypes?: ConfigItem[];
}

export function LeadDataTable<TData, TValue>({
  data,
  leadSources = [],
  leadStatuses = [],
  leadTypes = [],
}: DataTableProps<TData, TValue>) {
  const columns = createColumns(leadSources, leadStatuses, leadTypes) as ColumnDef<TData, TValue>[];
  const router = useRouter();
  const [rowSelection, setRowSelection] = React.useState({});
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const { data: session } = useSession();
  const isAdminOrCeo = session?.user?.role === "admin" || session?.user?.role === "ceo" || session?.user?.role === "coo";

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const [hide, setHide] = React.useState(false);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;
  // @ts-ignore
  const selectedIds = selectedRows.map((r) => r.original.id);
  const selectedCount = selectedIds.length;

  const handleDelete = async () => {
    try {
      setLoading(true);
      const res = await bulkDeleteLeads(selectedIds);
      if (res?.error) {
        toast.error(res.error);
      } else {
        table.toggleAllRowsSelected(false);
        toast.success(`${selectedCount} lead(s) deleted`);
        router.refresh();
      }
    } catch {
      toast.error("Failed to delete leads");
    } finally {
      setLoading(false);
      setDeleteOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={loading}
      />
      <div className="flex justify-between items-start gap-3">
        <div></div>
        <div className="flex justify-end space-x-2">
          {hide ? (
            <PanelTopOpen
              onClick={() => setHide(!hide)}
              className="text-muted-foreground"
            />
          ) : (
            <PanelTopClose
              onClick={() => setHide(!hide)}
              className="text-muted-foreground"
            />
          )}
        </div>
      </div>

      {hide ? (
        <div className="flex gap-2">
          This content is hidden now. Click on <PanelTopOpen /> to show content
        </div>
      ) : (
        <>
          <DataTableToolbar table={table} />
          {isAdminOrCeo && selectedCount > 0 && (
            <div className="flex items-center gap-3 rounded-md border bg-muted/50 px-4 py-2 text-sm">
              <span className="font-medium">{selectedCount} selected</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteOpen(true)}
                disabled={loading}
              >
                Delete Selected
              </Button>
            </div>
          )}
          <div className="rounded-md border overflow-x-auto">
            <Table data-testid="leads-table">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (
                          target.closest("input") ||
                          target.closest("button") ||
                          target.closest("[role='checkbox']") ||
                          target.closest("a")
                        ) {
                          return;
                        }
                        //@ts-ignore
                        if (row.original?.id) {
                          //@ts-ignore
                          router.push(`/crm/leads/${row.original.id}`);
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} />
        </>
      )}
    </div>
  );
}
