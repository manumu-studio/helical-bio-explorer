// Page: interactive request trace visualization — 23 spans from click to render.

import type { Metadata } from "next";

import { AppHeader } from "@/components/AppHeader";
import { RequestTrace } from "@/components/RequestTrace";

export const metadata: Metadata = {
  title: "Request Trace — 23 Spans",
  description:
    "Interactive request trace through the helical-bio-explorer stack: 16 outbound spans, 7 return spans, from tab click to Plotly render.",
};

export default function RequestTracePage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      <AppHeader />
      <main className="flex min-h-0 flex-1 flex-col">
        <RequestTrace className="flex-1" />
      </main>
    </div>
  );
}
