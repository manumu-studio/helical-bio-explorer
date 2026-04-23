// Collapsible sidebar listing every span in a trace. Purely presentational —
// the caller hands in an array of items, each with optional section-header /
// divider inserts that should render immediately above the row.

import type {
  TraceMinimapDivider,
  TraceMinimapInsert,
  TraceMinimapProps,
  TraceMinimapSectionHeader,
} from "./TraceMinimap.types";

const DEFAULT_HEADER = "Span Map";

export function TraceMinimap({
  items,
  currentStep,
  onGoTo,
  collapsed,
  onToggle,
  headerLabel = DEFAULT_HEADER,
  initialSectionHeader,
}: TraceMinimapProps) {
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
            {headerLabel}
          </span>
        )}
        <span
          className={`ml-auto text-[10px] text-[var(--text-secondary)] ${collapsed ? "rotate-180" : ""}`}
        >
          {collapsed ? "›" : "‹"}
        </span>
      </button>

      <div className="space-y-0.5">
        {initialSectionHeader !== undefined && !collapsed ? (
          <div className="px-2 pb-1 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              {initialSectionHeader}
            </span>
          </div>
        ) : null}

        {items.map((item) => {
          const isActive = item.stepIndex === currentStep;
          const isPast = item.stepIndex < currentStep;

          return (
            <span key={item.key}>
              {item.insertsBefore.map((insert) => renderInsert(insert, collapsed))}

              <button
                type="button"
                onClick={() => { onGoTo(item.stepIndex); }}
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
                    item.wideBadge ? "h-5 w-7 px-0.5" : "h-5 w-5"
                  } ${
                    isActive
                      ? item.badgeActiveClass
                      : isPast
                        ? `${item.badgePastSurfaceClass} ${item.badgePastTextClass}`
                        : "bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                  }`}
                >
                  {item.label}
                </span>
                {collapsed ? null : <span className="truncate">{item.title}</span>}
              </button>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function renderInsert(insert: TraceMinimapInsert, collapsed: boolean) {
  if (insert.kind === "divider") {
    return renderDivider(insert, collapsed);
  }
  return renderSectionHeader(insert, collapsed);
}

function renderDivider(d: TraceMinimapDivider, collapsed: boolean) {
  if (collapsed) {
    return (
      <div key={d.key} className="my-1 flex justify-center">
        <span className={`text-[10px] ${d.colorTextClass}`}>{d.shortIcon}</span>
      </div>
    );
  }
  return (
    <div key={d.key} className="my-2 flex items-center gap-2 px-2">
      <div className={`h-px flex-1 ${d.colorLineClass}`} />
      <span className={`text-[10px] font-bold ${d.colorTextClass}`}>{d.longLabel}</span>
      <div className={`h-px flex-1 ${d.colorLineClass}`} />
    </div>
  );
}

function renderSectionHeader(h: TraceMinimapSectionHeader, collapsed: boolean) {
  if (collapsed) return null;
  return (
    <div key={h.key} className="px-2 pb-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
        {h.label}
      </span>
    </div>
  );
}
