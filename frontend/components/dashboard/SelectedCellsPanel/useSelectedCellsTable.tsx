// TanStack Table wiring for the selected-cells panel (sortable).

import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";

import type { SelectedCellsPanelRow } from "@/components/dashboard/SelectedCellsPanel/SelectedCellsPanel.types";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { colorForCellType } from "@/lib/constants/cellTypeColors";

const columnHelper = createColumnHelper<SelectedCellsPanelRow>();

function truncateId(id: string): string {
  return id.length <= 12 ? id : `${id.slice(0, 10)}…`;
}

export function useSelectedCellsTable(rows: SelectedCellsPanelRow[]) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "divergence", desc: true }]);

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "rank",
        header: "Rank",
        cell: (ctx) => ctx.row.index + 1,
      }),
      columnHelper.accessor("cell_id", {
        header: "Cell ID",
        cell: (info) => {
          const full = info.getValue();
          return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default font-mono">{truncateId(full)}</span>
              </TooltipTrigger>
              <TooltipContent>{full}</TooltipContent>
            </Tooltip>
          );
        },
      }),
      columnHelper.accessor("cell_type", {
        header: "Cell type",
        cell: (info) => {
          const v = info.getValue();
          return (
            <Badge
              variant="outline"
              className="border-transparent text-[var(--text-primary)]"
              style={{ backgroundColor: `${colorForCellType(v)}33` }}
            >
              {v}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("condition", {
        header: "Condition",
        cell: (info) => info.getValue() ?? "—",
      }),
      columnHelper.accessor("divergence", {
        header: "Divergence",
        cell: (info) => {
          const v = info.getValue();
          return v === null ? "—" : v.toFixed(4);
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return { table, sorting };
}
