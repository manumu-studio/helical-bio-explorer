// Props for the dashboard chrome: header, provenance, tab bar, and main content slot.

import type { ReactNode } from "react";

import type { FetchSource } from "@/lib/fetcher";
import type { ProvenanceResponse } from "@/lib/schemas/provenance";

export type DashboardTabId = "reference" | "projection" | "distance" | "disagreement";

export interface DashboardShellProps {
  activeTab: DashboardTabId;
  onTabChange: (tab: DashboardTabId) => void;
  source: FetchSource;
  provenance: ProvenanceResponse | null;
  children: ReactNode;
}
