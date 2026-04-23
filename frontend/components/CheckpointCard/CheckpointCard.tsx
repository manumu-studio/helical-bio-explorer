// Detail card for the current request-trace checkpoint — badges, title, file
// link, description + code, project tree, backpack delta, data preview, ADRs,
// and the failure scenario.

import { CodeBlock } from "@/components/CodeBlock";
import { FileTreeDisplay } from "@/components/FileTreeDisplay";
import {
  DIRECTION_LABEL,
  ENV_CONFIG,
  GATE_ICON,
  GITHUB_REPO,
  getDisplayInfo,
} from "@/lib/request-trace";

import type { CheckpointCardProps } from "./CheckpointCard.types";

export function CheckpointCard({ checkpoint, currentStep, onRevealContext }: CheckpointCardProps) {
  const envConfig = ENV_CONFIG[checkpoint.environment];
  const display = getDisplayInfo(checkpoint.step);
  const githubUrl = checkpoint.file !== null ? `${GITHUB_REPO}/${checkpoint.file}` : null;

  return (
    <div className="space-y-4">
      {/* Header: step badge + environment + direction + gate + optional phase pill */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold ${
            checkpoint.direction === "return"
              ? "bg-amber-500/20 text-amber-700 ring-1 ring-amber-500/50 dark:text-amber-300"
              : "bg-[var(--accent-indigo)] text-white"
          }`}
        >
          {display.label}
        </span>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${envConfig.surface} ${envConfig.text}`}
        >
          {envConfig.label}
        </span>

        <span className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 text-xs text-[var(--text-secondary)]">
          {checkpoint.direction === "outbound" ? "→" : "←"}{" "}
          {DIRECTION_LABEL[checkpoint.direction]}
        </span>

        <span className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 text-xs text-[var(--text-secondary)]">
          {GATE_ICON[checkpoint.gateType]}{" "}
          {checkpoint.gateType === "data" ? "Data gate" : "Validator gate"}
        </span>

        {checkpoint.direction === "return" ? (
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 text-xs text-[var(--text-secondary)]">
            {display.phaseLabel} step {String(display.phaseStep)} of {String(display.phaseTotal)}
          </span>
        ) : null}
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

      <section className="space-y-2">
        <h3 className="flex items-baseline gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          <span aria-hidden>📂</span>
          <span>Where this lives in the repo</span>
        </h3>
        <FileTreeDisplay currentStep={currentStep} />
      </section>

      {checkpoint.backpackAdds.length > 0 ? (
        <button
          type="button"
          onClick={onRevealContext}
          className="group block w-full cursor-pointer rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-left transition-colors hover:border-emerald-500/60 hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          aria-label="Toggle Request Context sidebar"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              ➕ Added to &ldquo;🧭 Request Context&rdquo;
            </span>
            <span className="text-xs text-emerald-700/70 opacity-0 transition-opacity group-hover:opacity-100 dark:text-emerald-300/70">
              Toggle sidebar →
            </span>
          </div>
          <dl className="space-y-1">
            {checkpoint.backpackAdds.map((entry) => (
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
      ) : (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3">
          <p className="text-sm text-[var(--text-secondary)]">
            🎫 Validator gate — nothing added, just checking the ticket
          </p>
        </div>
      )}

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

      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
        <p className="mb-1 text-sm font-semibold text-red-700 dark:text-red-300">
          ❌ If this gate says &quot;no&quot;:
        </p>
        <p className="text-sm text-[var(--text-primary)]">
          {checkpoint.onFailure.code !== null ? (
            <span className="mr-2 font-mono text-red-700 dark:text-red-300">
              {checkpoint.onFailure.code}
            </span>
          ) : null}
          {checkpoint.onFailure.message}
        </p>
      </div>
    </div>
  );
}
