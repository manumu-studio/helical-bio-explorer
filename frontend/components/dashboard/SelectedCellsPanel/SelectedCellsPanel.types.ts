// Rows for the TanStack sortable selection table (lasso detail panel).

export interface SelectedCellsPanelRow {
  cell_id: string;
  cell_type: string;
  condition: string | null;
  /** Primary sort metric; null sorts last. */
  divergence: number | null;
}

export interface SelectedCellsPanelProps {
  rows: SelectedCellsPanelRow[];
}
