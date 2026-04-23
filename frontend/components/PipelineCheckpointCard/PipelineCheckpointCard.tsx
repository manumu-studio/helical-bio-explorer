// Detail card for the current pipeline-trace checkpoint — step badge, phase
// badge, environment chip, file link, description + code, artifact delta,
// data preview, ADR references, and the design-decision callout.

import { CodeBlock } from "@/components/CodeBlock";
import {
  PHASE_LABELS,
  PIPELINE_ENV_CONFIG,
  PIPELINE_GITHUB_REPO,
} from "@/lib/pipeline-trace";

import type { PipelineCheckpointCardProps } from "./PipelineCheckpointCard.types";

export function PipelineCheckpointCard({ checkpoint, onRevealArtifacts }: PipelineCheckpointCardProps) {
  const envConfig = PIPELINE_ENV_CONFIG[checkpoint.environment];
  const githubUrl =
    checkpoint.file !== null ? `${PIPELINE_GITHUB_REPO}/${checkpoint.file}` : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-indigo)] text-lg font-bold text-white">
          {String(checkpoint.step)}
        </span>

        <span className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 text-xs font-medium text-[var(--text-primary)]">
          {PHASE_LABELS[checkpoint.phase]}
        </span>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${envConfig.surface} ${envConfig.text}`}
        >
          {envConfig.label}
        </span>
      </div>

      <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
        {checkpoint.title}
      </h2>

      {checkpoint.file !== null ? (
        <a
          href={githubUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 break-all font-mono text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-indigo)]"
        >
          {checkpoint.file}
          <span className="shrink-0 text-xs opacity-0 transition-opacity group-hover:opacity-100">
            ↗
          </span>
        </a>
      ) : null}

      <section className="space-y-3">
        <h3 className="flex items-baseline gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          <span aria-hidden>💻</span>
          <span>What runs at this step</span>
        </h3>
        <p className="leading-relaxed text-[var(--text-primary)]">{checkpoint.description}</p>
        <CodeBlock code={checkpoint.code} language={checkpoint.codeLanguage} />
      </section>

      {checkpoint.artifactAdds.length > 0 ? (
        <button
          type="button"
          onClick={onRevealArtifacts}
          className="group block w-full cursor-pointer rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-left transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          aria-label="Toggle Artifact Accumulator sidebar"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              ➕ Added to &ldquo;📦 Artifact Accumulator&rdquo;
            </span>
            <span className="text-xs text-emerald-700/70 opacity-0 transition-opacity group-hover:opacity-100 dark:text-emerald-300/70">
              Toggle sidebar →
            </span>
          </div>
          <dl className="space-y-1">
            {checkpoint.artifactAdds.map((entry) => (
              <div
                key={entry.key}
                className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 text-sm"
              >
                <dt className="font-mono text-emerald-700 dark:text-emerald-300">{entry.key}:</dt>
                <dd className="min-w-0 break-all text-[var(--text-primary)]">{entry.value}</dd>
              </div>
            ))}
          </dl>
        </button>
      ) : null}

      {checkpoint.dataPreview !== null ? (
        <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
          <p className="mb-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
            📊 {checkpoint.dataPreview.label}
          </p>
          <div className="space-y-2">
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 text-sm">
              <span className="shrink-0 font-medium text-[var(--text-secondary)]">Shape:</span>
              <span className="min-w-0 break-all text-[var(--text-primary)]">
                {checkpoint.dataPreview.shape}
              </span>
            </div>
            {checkpoint.dataPreview.sampleJson !== "" ? (
              <div className="overflow-x-auto rounded border border-[var(--border)] bg-[var(--bg-elevated)] p-2">
                <pre className="text-xs leading-relaxed">
                  <code className="font-mono text-purple-700 dark:text-purple-300">
                    {checkpoint.dataPreview.sampleJson}
                  </code>
                </pre>
              </div>
            ) : null}
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 text-sm">
              <span className="shrink-0 font-medium text-[var(--text-secondary)]">Size:</span>
              <span className="min-w-0 text-[var(--text-primary)]">
                {checkpoint.dataPreview.sizeNote}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {checkpoint.designDecision !== null ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
          <p className="mb-1 text-sm font-semibold text-amber-700 dark:text-amber-300">
            🎯 {checkpoint.designDecision.title}
          </p>
          <p className="text-sm leading-relaxed text-[var(--text-primary)]">
            {checkpoint.designDecision.explanation}
          </p>
        </div>
      ) : null}

      {checkpoint.adrReferences.length > 0 ? (
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-3">
          <p className="mb-2 text-sm font-semibold text-cyan-700 dark:text-cyan-300">
            📐 Architecture Decisions
          </p>
          <div className="space-y-2.5">
            {checkpoint.adrReferences.map((adr) => (
              <div key={adr.id} className="flex items-start gap-2 text-sm">
                <span className="shrink-0 rounded bg-cyan-500/15 px-1.5 py-0.5 font-mono text-xs font-bold text-cyan-700 dark:text-cyan-300">
                  {adr.id}
                </span>
                <div className="min-w-0">
                  <span className="font-medium text-[var(--text-primary)]">{adr.title}</span>
                  <span className="text-[var(--text-secondary)]"> — </span>
                  <span className="text-[var(--text-secondary)]">{adr.relevance}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
