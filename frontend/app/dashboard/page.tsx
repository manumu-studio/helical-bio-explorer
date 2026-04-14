// Client dashboard: tabbed reference-mapping views with shared shell and provenance.

"use client";

import { useCallback, useState } from "react";

import { DashboardShell, type DashboardTabId } from "@/components/DashboardShell";
import { DisagreementView } from "@/components/DisagreementView";
import { DistanceView } from "@/components/DistanceView";
import { ProjectionView } from "@/components/ProjectionView";
import { ReferenceView } from "@/components/ReferenceView";
import type { FetchSource } from "@/lib/fetcher";

const INITIAL_SOURCES: Record<DashboardTabId, FetchSource> = {
  reference: "unknown",
  projection: "unknown",
  distance: "unknown",
  disagreement: "unknown",
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTabId>("reference");
  const [sources, setSources] = useState<Record<DashboardTabId, FetchSource>>(INITIAL_SOURCES);

  const bindSource = useCallback((tab: DashboardTabId) => {
    return (source: FetchSource) => {
      setSources((prev) => ({ ...prev, [tab]: source }));
    };
  }, []);

  return (
    <DashboardShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      source={sources[activeTab]}
    >
      {activeTab === "reference" ? (
        <ReferenceView onSourceChange={bindSource("reference")} />
      ) : null}
      {activeTab === "projection" ? (
        <ProjectionView onSourceChange={bindSource("projection")} />
      ) : null}
      {activeTab === "distance" ? (
        <DistanceView onSourceChange={bindSource("distance")} />
      ) : null}
      {activeTab === "disagreement" ? (
        <DisagreementView onSourceChange={bindSource("disagreement")} />
      ) : null}
    </DashboardShell>
  );
}
