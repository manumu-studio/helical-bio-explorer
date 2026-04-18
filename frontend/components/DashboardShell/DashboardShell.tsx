// Dashboard chrome: logo, provenance header, browser-tab navigation, and scrollable content region.

"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useState } from "react";

import { AboutPanel } from "@/components/AboutPanel";
import { DashboardFooter } from "@/components/DashboardFooter";
import { ProvenanceChip } from "@/components/ProvenanceChip";
import type { DashboardShellProps, DashboardTabId } from "@/components/DashboardShell/DashboardShell.types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { APP_DISPLAY_NAME, APP_DISPLAY_NAME_SHORT } from "@/lib/constants/appBranding";

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
  const { resolvedTheme } = useTheme();
  const logoSrc =
    resolvedTheme === "light" ? "/assets/logo-black.webp" : "/assets/logo-white.webp";

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => onTabChange(v as DashboardTabId)}
      className="flex h-screen flex-col overflow-hidden"
    >
      {/* ── Header ── */}
      <header className="flex items-start justify-between gap-2 px-3 py-2 md:items-center md:px-6 md:py-3">
        <Link
          href="/"
          aria-label="Home — back to landing"
          className="-m-1.5 flex min-w-0 max-w-[min(100%,42rem)] flex-1 items-center gap-2 rounded-lg p-1.5 outline-none transition-colors hover:bg-[var(--bg-elevated)] focus-visible:ring-2 focus-visible:ring-[var(--accent-indigo)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] sm:gap-3"
        >
          <Image
            key={logoSrc}
            src={logoSrc}
            alt=""
            width={40}
            height={40}
            className="h-7 w-7 shrink-0 opacity-90 md:h-10 md:w-10"
            priority
          />
          <span className="line-clamp-2 text-xs font-semibold leading-snug tracking-tight text-[var(--text-primary)] md:hidden">
            {APP_DISPLAY_NAME_SHORT}
          </span>
          <span className="hidden text-sm font-semibold tracking-tight text-[var(--text-primary)] md:inline md:text-base">
            {APP_DISPLAY_NAME}
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setAboutOpen(true)}
            className="rounded-full border border-[var(--border)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
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
