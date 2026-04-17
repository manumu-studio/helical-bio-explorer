// Client dashboard: tabbed reference-mapping views with shared shell and provenance.

"use client";

import { useCallback, useState } from "react";

import { DashboardShell, type DashboardTabId } from "@/components/DashboardShell";
import { useDashboardProvenance } from "@/components/DashboardShell/useDashboardProvenance";
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
  const [referenceModel, setReferenceModel] = useState("geneformer");
  const [projectionModel, setProjectionModel] = useState("geneformer");

  const { provenance } = useDashboardProvenance(activeTab, referenceModel, projectionModel);

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
      provenance={provenance}
    >
      {activeTab === "reference" ? (
        <ReferenceView
          onSourceChange={bindSource("reference")}
          modelName={referenceModel}
          onModelNameChange={setReferenceModel}
        />
      ) : null}
      {activeTab === "projection" ? (
        <ProjectionView
          onSourceChange={bindSource("projection")}
          modelName={projectionModel}
          onModelNameChange={setProjectionModel}
        />
      ) : null}
      {activeTab === "distance" ? <DistanceView onSourceChange={bindSource("distance")} /> : null}
      {activeTab === "disagreement" ? (
        <DisagreementView onSourceChange={bindSource("disagreement")} />
      ) : null}
    </DashboardShell>
  );
}
