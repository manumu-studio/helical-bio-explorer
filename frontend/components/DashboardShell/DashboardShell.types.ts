// Props for the dashboard chrome: header, provenance, tab bar, and main content slot.

import type { ReactNode } from "react";

import type { FetchSource } from "@/lib/fetcher";

export type DashboardTabId = "reference" | "projection" | "distance" | "disagreement";

export interface DashboardShellProps {
  activeTab: DashboardTabId;
  onTabChange: (tab: DashboardTabId) => void;
  source: FetchSource;
  children: ReactNode;
}
