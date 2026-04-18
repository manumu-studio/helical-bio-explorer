// Client dashboard: tabbed reference-mapping views with shared shell and provenance.

"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import { DashboardShell, type DashboardTabId } from "@/components/DashboardShell";
import { useDashboardProvenance } from "@/components/DashboardShell/useDashboardProvenance";
import { DisagreementView } from "@/components/DisagreementView";
import { DistanceView } from "@/components/DistanceView";
import { ProjectionView } from "@/components/ProjectionView";
import { ReferenceView } from "@/components/ReferenceView";
import type { FetchSource } from "@/lib/fetcher";
import { useSelectionStore } from "@/lib/stores/useSelectionStore";

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
  const clearSelection = useSelectionStore((s) => s.clearSelection);
  const reduceMotion = useReducedMotion();

  const bindSource = useCallback((tab: DashboardTabId) => {
    return (source: FetchSource) => {
      setSources((prev) => ({ ...prev, [tab]: source }));
    };
  }, []);

  useEffect(() => {
    clearSelection();
  }, [activeTab, clearSelection]);

  const tabTransition = reduceMotion ? { duration: 0 } : { duration: 0.25 };

  return (
    <DashboardShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      source={sources[activeTab]}
      provenance={provenance}
    >
      <AnimatePresence mode="wait">
        {activeTab === "reference" ? (
          <motion.div
            key="reference"
            className="flex min-h-0 flex-1 flex-col"
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={tabTransition}
          >
            <ReferenceView
              onSourceChange={bindSource("reference")}
              modelName={referenceModel}
              onModelNameChange={setReferenceModel}
            />
          </motion.div>
        ) : null}
        {activeTab === "projection" ? (
          <motion.div
            key="projection"
            className="flex min-h-0 flex-1 flex-col"
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={tabTransition}
          >
            <ProjectionView
              onSourceChange={bindSource("projection")}
              modelName={projectionModel}
              onModelNameChange={setProjectionModel}
            />
          </motion.div>
        ) : null}
        {activeTab === "distance" ? (
          <motion.div
            key="distance"
            className="flex min-h-0 flex-1 flex-col"
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={tabTransition}
          >
            <DistanceView onSourceChange={bindSource("distance")} />
          </motion.div>
        ) : null}
        {activeTab === "disagreement" ? (
          <motion.div
            key="disagreement"
            className="flex min-h-0 flex-1 flex-col"
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={tabTransition}
          >
            <DisagreementView onSourceChange={bindSource("disagreement")} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </DashboardShell>
  );
}
