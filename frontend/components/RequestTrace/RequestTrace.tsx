// Interactive simulation of a request traveling through 23 checkpoints in the codebase.

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  BackpackEntry,
  Checkpoint,
  Direction,
  Environment,
  TokenType,
  TreeLine,
} from "@/lib/request-trace";
import { buildFileTree, CHECKPOINTS, highlight, renderTreeLines } from "@/lib/request-trace";
import { RequestTraceInfo } from "@/components/RequestTraceInfo";

import type { RequestTraceProps } from "./RequestTrace.types";
import { useRequestTrace } from "./useRequestTrace";

/* ── Environment colors & labels ─────────────────────────────────── */
// Colors are tuned to work in both light and dark themes — we use
// moderate saturations that read well on white and deep slate alike.

interface EnvStyle {
  readonly label: string;
  /** Text color token for labels / headings. */
  readonly text: string;
  /** Subtle translucent background. */
  readonly surface: string;
  /** Solid bar color at the active step. */
  readonly barActive: string;
  /** Faded bar color for past steps. */
  readonly barPast: string;
}

const ENV_CONFIG: Record<Environment, EnvStyle> = {
  frontend: {
    label: "Frontend",
    text: "text-blue-600 dark:text-blue-400",
    surface: "border-blue-500/30 bg-blue-500/10",
    barActive: "bg-blue-500 dark:bg-blue-400",
    barPast: "bg-blue-500/40 dark:bg-blue-400/40",
  },
  network: {
    label: "Network",
    text: "text-amber-600 dark:text-amber-400",
    surface: "border-amber-500/30 bg-amber-500/10",
    barActive: "bg-amber-500 dark:bg-amber-400",
    barPast: "bg-amber-500/40 dark:bg-amber-400/40",
  },
  backend: {
    label: "Backend",
    text: "text-orange-600 dark:text-orange-400",
    surface: "border-orange-500/30 bg-orange-500/10",
    barActive: "bg-orange-500 dark:bg-orange-400",
    barPast: "bg-orange-500/40 dark:bg-orange-400/40",
  },
  database: {
    label: "Database",
    text: "text-emerald-600 dark:text-emerald-400",
    surface: "border-emerald-500/30 bg-emerald-500/10",
    barActive: "bg-emerald-500 dark:bg-emerald-400",
    barPast: "bg-emerald-500/40 dark:bg-emerald-400/40",
  },
};

const DIRECTION_LABEL: Record<Direction, string> = {
  outbound: "Outbound — the click is asking",
  return: "Return — the answer comes back",
};

const TURNAROUND_STEP = 16;

const GATE_ICON: Record<string, string> = {
  data: "📦",
  validator: "🎫",
};

const GITHUB_REPO = "https://github.com/manumu-studio/helical-bio-explorer/blob/main";

const OUTBOUND_COUNT = 16;
const RETURN_COUNT = 7;

interface DisplayInfo {
  readonly label: string;
  readonly phaseLabel: string;
  readonly phaseStep: number;
  readonly phaseTotal: number;
}

function getDisplayInfo(step: number): DisplayInfo {
  if (step <= OUTBOUND_COUNT) {
    return { label: String(step), phaseLabel: "Outbound", phaseStep: step, phaseTotal: OUTBOUND_COUNT };
  }
  const returnStep = step - OUTBOUND_COUNT;
  return { label: `R${String(returnStep)}`, phaseLabel: "Return", phaseStep: returnStep, phaseTotal: RETURN_COUNT };
}

/* ── TraceProgress bar (clickable with tooltips) ─────────────────── */

function TraceProgress({
  currentStep,
  totalSteps,
  onGoTo,
}: {
  currentStep: number;
  totalSteps: number;
  onGoTo: (step: number) => void;
}) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-0.5">
      <span className="mr-1 text-[10px] font-medium text-[var(--text-secondary)]">→</span>

      {Array.from({ length: totalSteps }, (_, i) => {
        const cp = CHECKPOINTS[i];
        if (cp === undefined) return null;
        const envConf = ENV_CONFIG[cp.environment];
        const isActive = i === currentStep;
        const isPast = i < currentStep;
        const display = getDisplayInfo(cp.step);
        const hasFile = cp.file !== null;
        const githubUrl = hasFile ? `${GITHUB_REPO}/${cp.file}` : null;

        function handleBarClick() {
          if (isActive && githubUrl !== null) {
            window.open(githubUrl, "_blank", "noopener");
          } else if (!isActive) {
            onGoTo(i);
          }
        }

        return (
          <span key={i} className="relative flex flex-1 items-center gap-0.5">
            {i === TURNAROUND_STEP ? (
              <span className="mx-0.5 text-[10px] text-amber-500 dark:text-amber-400">⟳</span>
            ) : null}

            <button
              type="button"
              onClick={handleBarClick}
              onMouseEnter={() => { setHoveredBar(i); }}
              onMouseLeave={() => { setHoveredBar(null); }}
              className="relative w-full cursor-pointer py-1.5"
              aria-label={`Step ${display.label}: ${cp.title}`}
            >
              <div
                className={`h-2 w-full rounded-full transition-all duration-300 ${
                  isActive
                    ? `${envConf.barActive} scale-y-150 shadow-sm`
                    : isPast
                      ? envConf.barPast
                      : "bg-[var(--border)]"
                }`}
              />
            </button>

            {hoveredBar === i ? (
              <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-3 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs shadow-xl">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[var(--border)]" />
                <div className="flex items-center gap-1.5">
                  {isActive ? <span className="text-emerald-500 dark:text-emerald-400">★</span> : null}
                  <span className={`font-semibold ${envConf.text}`}>
                    {display.phaseLabel} {display.label}
                  </span>
                  <span className="text-[var(--text-secondary)]">·</span>
                  <span className="text-[var(--text-primary)]">{cp.title.split(" — ")[0]}</span>
                </div>
                {hasFile ? (
                  <div className="mt-1 truncate font-mono text-[10px] text-[var(--text-secondary)]">
                    {cp.file}
                  </div>
                ) : null}
                <div className={`mt-1.5 font-medium ${isActive ? "text-[var(--accent-indigo)]" : "text-[var(--text-secondary)]"}`}>
                  {isActive
                    ? githubUrl !== null
                      ? "Click to open in GitHub ↗"
                      : "Network transit — no file"
                    : "Click to jump →"}
                </div>
              </div>
            ) : null}
          </span>
        );
      })}

      <span className="ml-1 text-[10px] font-medium text-[var(--text-secondary)]">←</span>
    </div>
  );
}

/* ── RequestContextDisplay ─────────────────────────────────────────── */

function RequestContextDisplay({
  entries,
  isOpen,
  onToggle,
}: {
  entries: readonly BackpackEntry[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        aria-expanded={isOpen}
      >
        <span
          className="relative inline-flex items-baseline gap-1.5 text-sm font-semibold text-[var(--text-primary)]"
          onMouseEnter={() => { setShowTooltip(true); }}
          onMouseLeave={() => { setShowTooltip(false); }}
        >
          <span aria-hidden>🧭</span>
          <span>Request Context</span>
          <span className="text-[var(--text-secondary)]">({entries.length})</span>
          {showTooltip ? (
            <span className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-64 whitespace-normal rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-xs font-normal text-[var(--text-secondary)] shadow-xl">
              <span className="absolute bottom-full left-6 block border-4 border-transparent border-b-[var(--border)]" />
              Data accumulated as the request propagates through each span — grows from empty to the full payload needed for rendering.
            </span>
          ) : null}
        </span>
        <span className="shrink-0 text-xs text-[var(--text-secondary)]">
          {isOpen ? "collapse" : "expand"}
        </span>
      </button>

      {isOpen ? (
        <div className="border-t border-emerald-500/30 px-4 py-3">
          {entries.length === 0 ? (
            <p className="text-sm italic text-[var(--text-secondary)]">
              Empty — request not yet initiated
            </p>
          ) : (
            <dl className="space-y-1.5">
              {entries.map((entry, i) => (
                <div
                  key={`${entry.key}-${String(i)}`}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 text-sm"
                >
                  <dt className="shrink-0 font-mono text-emerald-700 dark:text-emerald-300">
                    {entry.key}:
                  </dt>
                  <dd className="min-w-0 break-all text-[var(--text-primary)]">
                    {entry.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* ── Code block ──────────────────────────────────────────────────── */

// VS Code "Light+" (light mode) → "Dark+" (dark mode) token palette.
// Arbitrary-value Tailwind classes keep everything in className (no inline
// styles) so the dark-variant swap is a single class compile-time.
const TOKEN_CLASS: Record<TokenType, string> = {
  text: "text-[#1f2328] dark:text-[#d4d4d4]",
  comment: "italic text-[#008000] dark:text-[#6a9955]",
  string: "text-[#a31515] dark:text-[#ce9178]",
  number: "text-[#098658] dark:text-[#b5cea8]",
  keyword: "text-[#af00db] dark:text-[#c586c0]",
  storage: "text-[#0000ff] dark:text-[#569cd6]",
  builtin: "text-[#267f99] dark:text-[#4ec9b0]",
  function: "text-[#795e26] dark:text-[#dcdcaa]",
  decorator: "text-[#795e26] dark:text-[#dcdcaa]",
  variable: "text-[#001080] dark:text-[#9cdcfe]",
};

function CodeBlock({ code, language }: { code: string; language: string }) {
  const tokens = useMemo(() => highlight(code, language), [code, language]);

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
          {language}
        </span>
      </div>
      <pre className="overflow-x-auto p-3 text-sm leading-relaxed">
        <code className="font-mono">
          {tokens.map((t, i) => (
            <span key={i} className={TOKEN_CLASS[t.type]}>
              {t.text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

/* ── FileTree: shows where the current file sits in the project ─── */

function FileTreeDisplay({ currentStep }: { currentStep: number }) {
  const [isOpen, setIsOpen] = useState(true);

  const lines = useMemo<readonly TreeLine[]>(() => {
    const tree = buildFileTree(CHECKPOINTS, currentStep);
    return renderTreeLines(tree);
  }, [currentStep]);

  if (lines.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
          Project tree
        </span>
        <button
          type="button"
          onClick={() => { setIsOpen((prev) => !prev); }}
          className="text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Collapse repo tree" : "Expand repo tree"}
        >
          {isOpen ? "collapse" : "expand"}
        </button>
      </div>

      {isOpen ? (
        <div className="px-3 py-2">
          {/*
            Tree rows must use a tight, fixed leading or the vertical tree
            connectors (│) from consecutive rows leave visible gaps and the
            lines look broken. `leading-[1.35]` is tight enough that `│` segments
            touch, while still leaving the text breathable.

            Each row's icon sits in a fixed-width cell (`w-5`) so file and
            folder names line up at every depth regardless of which emoji the
            browser renders.
          */}
          <pre className="font-mono text-sm leading-[1.35]">
            <span className="text-[var(--text-secondary)]">helical-bio-explorer/</span>
            {"\n"}
            {lines.map((line, i) => {
              const stepLabel = line.step !== null
                ? line.isCurrent
                  ? ` ★ step ${String(line.step)}`
                  : ` ← step ${String(line.step)}`
                : "";
              const icon = line.isFile ? "📄" : "📁";

              return (
                <span key={i}>
                  <span className="text-[var(--text-secondary)]">{line.prefix}</span>
                  <span
                    className="inline-block w-5 shrink-0 text-center align-middle"
                    aria-hidden
                  >
                    {icon}
                  </span>
                  <span
                    className={`align-middle ${
                      line.isCurrent
                        ? "font-bold text-emerald-600 dark:text-emerald-400"
                        : line.step !== null
                          ? "text-[var(--text-primary)]"
                          : "text-[var(--text-secondary)]"
                    }`}
                  >
                    {line.name}
                  </span>
                  {stepLabel !== "" ? (
                    <span
                      className={`align-middle ${
                        line.isCurrent
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-[var(--text-secondary)]"
                      }`}
                    >
                      {stepLabel}
                    </span>
                  ) : null}
                  {"\n"}
                </span>
              );
            })}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

/* ── CheckpointCard ──────────────────────────────────────────────── */

function CheckpointCard({
  checkpoint,
  currentStep,
  onRevealContext,
}: {
  checkpoint: Checkpoint;
  currentStep: number;
  onRevealContext: () => void;
}) {
  const envConfig = ENV_CONFIG[checkpoint.environment];
  const display = getDisplayInfo(checkpoint.step);
  const githubUrl = checkpoint.file !== null ? `${GITHUB_REPO}/${checkpoint.file}` : null;

  return (
    <div className="space-y-4">
      {/* Header: step, environment, direction, gate */}
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

      {/* Title */}
      <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
        {checkpoint.title}
      </h2>

      {/* File path — clickable link to GitHub */}
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

      {/* ── What happens here: description + code snippet, titled ── */}
      <section className="space-y-3">
        <h3 className="flex items-baseline gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          <span aria-hidden>💻</span>
          <span>What runs at this step</span>
        </h3>
        <p className="leading-relaxed text-[var(--text-primary)]">{checkpoint.description}</p>
        <CodeBlock code={checkpoint.code} language={checkpoint.codeLanguage} />
      </section>

      {/* ── Where this lives in the repo ── */}
      <section className="space-y-2">
        <h3 className="flex items-baseline gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          <span aria-hidden>📂</span>
          <span>Where this lives in the repo</span>
        </h3>
        <FileTreeDisplay currentStep={currentStep} />
      </section>

      {/* What this checkpoint adds to the backpack */}
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

      {/* Data preview — shows what the data looks like at this checkpoint */}
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

      {/* ADR references — architecture decisions behind this span */}
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

      {/* On failure */}
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

/* ── Minimap: step list sidebar (collapsible) ──────────────────── */

function Minimap({
  currentStep,
  onGoTo,
  collapsed,
  onToggle,
}: {
  currentStep: number;
  onGoTo: (step: number) => void;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="hidden max-h-[90vh] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-2 shadow-sm lg:block">
      <button
        type="button"
        onClick={onToggle}
        className="mb-1 flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[var(--bg-elevated)]"
        aria-expanded={!collapsed}
      >
        <span className="text-sm" aria-hidden>🗺️</span>
        {collapsed ? null : (
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Span Map
          </span>
        )}
        <span
          className={`ml-auto text-[10px] text-[var(--text-secondary)] ${collapsed ? "rotate-180" : ""}`}
        >
          {collapsed ? "›" : "‹"}
        </span>
      </button>

      <div className="space-y-0.5">
        {collapsed ? null : (
          <div className="px-2 pb-1 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              → Outbound — asking
            </span>
          </div>
        )}

        {CHECKPOINTS.map((cp, i) => {
          const envConf = ENV_CONFIG[cp.environment];
          const isActive = i === currentStep;
          const isPast = i < currentStep;
          const display = getDisplayInfo(cp.step);

          return (
            <span key={cp.step}>
              {i === TURNAROUND_STEP ? (
                collapsed ? (
                  <div className="my-1 flex justify-center">
                    <span className="text-[10px] text-amber-500 dark:text-amber-400">⟳</span>
                  </div>
                ) : (
                  <div className="my-2 flex items-center gap-2 px-2">
                    <div className="h-px flex-1 bg-amber-500/40" />
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      ⟳ TURNAROUND
                    </span>
                    <div className="h-px flex-1 bg-amber-500/40" />
                  </div>
                )
              ) : null}

              {i === TURNAROUND_STEP && !collapsed ? (
                <div className="px-2 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                    ← Return — answering (7 steps)
                  </span>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => { onGoTo(i); }}
                className={`flex w-full items-center gap-2 rounded-lg py-1.5 text-left text-xs transition-colors ${
                  collapsed ? "justify-center px-0" : "px-2"
                } ${
                  isActive
                    ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] ring-1 ring-[var(--accent-indigo)]/60"
                    : isPast
                      ? "text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                <span
                  className={`flex shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    cp.direction === "return" ? "h-5 w-7 px-0.5" : "h-5 w-5"
                  } ${
                    isActive
                      ? cp.direction === "return"
                        ? "bg-amber-500 text-white dark:bg-amber-400 dark:text-black"
                        : "bg-[var(--accent-indigo)] text-white"
                      : isPast
                        ? `${envConf.surface} ${envConf.text}`
                        : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                  }`}
                >
                  {display.label}
                </span>
                {collapsed ? null : (
                  <span className="truncate">{cp.title.split(" — ")[0]}</span>
                )}
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main RequestTrace ─────────────────────────────────────────────── */

export function RequestTrace({ className }: RequestTraceProps) {
  const {
    currentStep,
    checkpoint,
    totalSteps,
    isFirst,
    isLast,
    cumulativeBackpack,
    backpackOpen,
    next,
    prev,
    goTo,
    reset,
    toggleBackpack,
  } = useRequestTrace();

  const [minimapCollapsed, setMinimapCollapsed] = useState(false);
  const [contextCollapsed, setContextCollapsed] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  // When the user clicks the emerald "Added to request context" block inside
  // the checkpoint card, we mirror the collapse chevron in the sidebar: toggle
  // the sidebar open/closed and keep the backpack list expanded on reveal so
  // the user immediately sees the cumulative context.
  const revealContext = useCallback(() => {
    setContextCollapsed((prev) => {
      const next = !prev;
      if (!next && !backpackOpen) toggleBackpack();
      return next;
    });
  }, [backpackOpen, toggleBackpack]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      // Don't swallow keystrokes while the user is typing in an input.
      if (target !== null) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) {
          return;
        }
      }
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "r" || e.key === "R") {
        reset();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => { window.removeEventListener("keydown", handleKeyDown); };
  }, [next, prev, reset]);

  const headerDisplay = checkpoint !== null ? getDisplayInfo(checkpoint.step) : null;

  if (checkpoint === null || headerDisplay === null) return null;

  return (
    <div
      className={`flex h-full flex-col gap-4 bg-[var(--bg-base)] p-4 text-[var(--text-primary)] ${className ?? ""}`}
    >
      {/* Top bar: title + progress + controls */}
      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h1 className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-[var(--text-primary)]">
            Request Trace
            <span className="text-xs font-normal text-[var(--text-secondary)]">
              {String(OUTBOUND_COUNT + RETURN_COUNT)} spans · click → render
            </span>
            <button
              type="button"
              onClick={() => { setInfoOpen(true); }}
              className="ml-1 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] text-xs text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              aria-label="About this trace"
              title="About this trace"
            >
              ?
            </button>
          </h1>
          <span className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                currentStep < TURNAROUND_STEP
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {currentStep < TURNAROUND_STEP ? "→ Outbound" : "← Return"}
            </span>
            {headerDisplay.phaseLabel} · Step {String(headerDisplay.phaseStep)} of {String(headerDisplay.phaseTotal)}
          </span>
        </div>

        <TraceProgress currentStep={currentStep} totalSteps={totalSteps} onGoTo={goTo} />

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={prev}
            disabled={isFirst}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-card)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            type="button"
            onClick={next}
            disabled={isLast}
            className="rounded-lg bg-[var(--accent-indigo)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next →
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          >
            Reset
          </button>
          <span className="ml-auto text-xs text-[var(--text-secondary)]">
            Arrow keys or Space to navigate · R to reset
          </span>
        </div>
      </div>

      {/* Main content: minimap + card + request context */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Minimap sidebar — collapsible */}
        <div className={`shrink-0 transition-all duration-300 ${minimapCollapsed ? "w-12" : "w-56"}`}>
          <Minimap
            currentStep={currentStep}
            onGoTo={goTo}
            collapsed={minimapCollapsed}
            onToggle={() => { setMinimapCollapsed((p) => !p); }}
          />
        </div>

        {/* Checkpoint card */}
        <div className="min-h-0 max-h-[90vh] flex-1 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
          <CheckpointCard
            checkpoint={checkpoint}
            currentStep={currentStep}
            onRevealContext={revealContext}
          />
        </div>

        {/* Request context sidebar — collapsible */}
        <div className={`shrink-0 transition-all duration-300 ${contextCollapsed ? "w-12" : "w-72"}`}>
          {contextCollapsed ? (
            <button
              type="button"
              onClick={() => { setContextCollapsed(false); }}
              className="flex w-full flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] py-3 shadow-sm transition-colors hover:bg-[var(--bg-elevated)]"
              aria-label="Expand Request Context"
            >
              <span className="text-sm" aria-hidden>🧭</span>
              <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                {cumulativeBackpack.length}
              </span>
              <span className="text-[10px] text-[var(--text-secondary)]">›</span>
            </button>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => { setContextCollapsed(true); }}
                className="absolute -left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-base)] text-[10px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                aria-label="Collapse Request Context"
              >
                ‹
              </button>
              <RequestContextDisplay
                entries={cumulativeBackpack}
                isOpen={backpackOpen}
                onToggle={toggleBackpack}
              />
            </div>
          )}
        </div>
      </div>

      <RequestTraceInfo open={infoOpen} onClose={() => { setInfoOpen(false); }} />
    </div>
  );
}
