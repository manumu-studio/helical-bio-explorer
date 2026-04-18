// Dashboard chrome: logo, provenance header, browser-tab navigation, and scrollable content region.

"use client";

import { useState } from "react";

import { AboutPanel } from "@/components/AboutPanel";
import { AppHeader } from "@/components/AppHeader";
import { DashboardFooter } from "@/components/DashboardFooter";
import { ProvenanceChip } from "@/components/ProvenanceChip";
import type { DashboardShellProps, DashboardTabId } from "@/components/DashboardShell/DashboardShell.types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <Tabs
      value={activeTab}
      onValueChange={(v) => onTabChange(v as DashboardTabId)}
      className="flex h-screen flex-col overflow-hidden"
    >
      {/* ── Header ── */}
      <AppHeader
        onAboutOpen={() => setAboutOpen(true)}
        rightSlot={<ProvenanceChip source={source} provenance={provenance} />}
      />

      {/* ── Tab navigation — browser-tab style, centered ── */}
      <nav className="flex justify-start overflow-x-auto bg-[var(--bg-base)] [-ms-overflow-style:none] [scrollbar-width:none] sm:justify-center md:overflow-x-visible [&::-webkit-scrollbar]:hidden">
        <TabsList className="relative mx-auto inline-flex h-auto w-max min-w-0 shrink-0 gap-0.5 bg-transparent p-0 md:max-w-2xl md:w-full">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className="overflow-hidden rounded-b-none border-x border-t border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium md:px-5 md:py-2.5 md:text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] data-[state=active]:z-10 data-[state=active]:bg-[var(--bg-base)] data-[state=active]:text-[var(--accent-indigo)] data-[state=active]:shadow-none"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </nav>

      {/* ── Content — stretch to fill remaining viewport height ── */}
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>

      <DashboardFooter />
      <AboutPanel open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </Tabs>
  );
}
