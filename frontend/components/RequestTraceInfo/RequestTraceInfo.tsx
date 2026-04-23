// Modal overlay explaining the Request Trace visualization and interaction guide.

import { REQUEST_TRACE_COPY, REQUEST_TRACE_HIGHLIGHTS } from "@/components/RequestTraceInfo/requestTraceInfoCopy";
import type { RequestTraceInfoProps } from "@/components/RequestTraceInfo/RequestTraceInfo.types";

export function RequestTraceInfo({ open, onClose }: RequestTraceInfoProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-trace-info-title"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
      }}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close info panel"
        onClick={onClose}
      />
      <div
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6 text-sm text-[var(--text-secondary)] shadow-xl"
        onClick={(e) => { e.stopPropagation(); }}
        onKeyDown={(e) => {
          if (e.key !== "Escape") e.stopPropagation();
        }}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2
            id="request-trace-info-title"
            className="text-base font-semibold text-[var(--text-primary)]"
          >
            About this trace
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
          >
            Close
          </button>
        </div>

        <p className="mb-3 leading-relaxed">{REQUEST_TRACE_COPY.what_it_is}</p>
        <p className="mb-3 leading-relaxed">{REQUEST_TRACE_COPY.how_to_navigate}</p>
        <p className="mb-3 leading-relaxed">{REQUEST_TRACE_COPY.span_interactions}</p>
        <p className="mb-4 leading-relaxed">{REQUEST_TRACE_COPY.what_to_look_for}</p>

        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
          Key design decisions
        </h3>
        <ul className="flex flex-col gap-2">
          {REQUEST_TRACE_HIGHLIGHTS.map((item) => (
            <li key={item.label} className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-[var(--accent-indigo)]">
                {item.label}
              </span>
              <span className="text-xs leading-relaxed text-[var(--text-secondary)]">
                {item.detail}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
