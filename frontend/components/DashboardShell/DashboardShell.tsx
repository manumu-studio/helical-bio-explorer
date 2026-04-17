// Dashboard chrome: title bar with provenance, pipeline tabs, and scrollable content region.

"use client";

import { useState } from "react";

import { AboutPanel } from "@/components/AboutPanel";
import { DashboardFooter } from "@/components/DashboardFooter";
import { ProvenanceChip } from "@/components/ProvenanceChip";
import type { DashboardShellProps, DashboardTabId } from "@/components/DashboardShell/DashboardShell.types";

const TABS: { id: DashboardTabId; label: string }[] = [
  { id: "reference", label: "Reference" },
  { id: "projection", label: "Projection" },
  { id: "distance", label: "Distance" },
  { id: "disagreement", label: "Disagreement" },
];

export function DashboardShell({
  activeTab,
  onTabChange,
  source,
  provenance,
  children,
}: DashboardShellProps) {
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-700 px-6 py-3">
        <span className="text-sm font-semibold tracking-tight text-slate-100 md:text-base">
          helical-bio-explorer
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Provenance</span>
          <button
            type="button"
            onClick={() => {
              setAboutOpen(true);
            }}
            className="rounded-full border border-slate-600 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label="About this demo"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-4 w-4"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
          </button>
          <ProvenanceChip source={source} provenance={provenance} />
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
      <DashboardFooter />
      <AboutPanel open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
