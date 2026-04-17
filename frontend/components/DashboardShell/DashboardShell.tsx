// Dashboard chrome: title bar with provenance, pipeline tabs, and scrollable content region.

"use client";

import { ProvenanceChip } from "@/components/ProvenanceChip";
import type { DashboardShellProps, DashboardTabId } from "@/components/DashboardShell/DashboardShell.types";

const TABS: { id: DashboardTabId; label: string }[] = [
  { id: "reference", label: "Reference" },
  { id: "projection", label: "Projection" },
  { id: "distance", label: "Distance" },
  { id: "disagreement", label: "Disagreement" },
];

export function DashboardShell({ activeTab, onTabChange, source, children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-700 px-6 py-3">
        <span className="text-sm font-semibold tracking-tight text-slate-100 md:text-base">
          helical-bio-explorer
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Provenance</span>
          <ProvenanceChip source={source} />
        </div>
      </header>

      <nav className="flex border-b border-slate-700 px-4 md:px-6">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onTabChange(tab.id);
              }}
              className={`relative px-4 py-3 text-sm font-medium transition-colors ${
                active ? "text-sky-300" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.label}
              {active ? (
                <span
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ backgroundColor: "var(--color-accent)" }}
                />
              ) : null}
            </button>
          );
        })}
      </nav>

      <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
    </div>
  );
}
