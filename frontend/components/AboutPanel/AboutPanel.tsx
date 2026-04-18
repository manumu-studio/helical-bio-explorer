// Modal with ADR-001 narrative and links to repo, Swagger, and Helical.

import { ABOUT_COPY, ABOUT_LINKS } from "@/components/AboutPanel/aboutPanelCopy";
import type { AboutPanelProps } from "@/components/AboutPanel/AboutPanel.types";

export function AboutPanel({ open, onClose }: AboutPanelProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-demo-title"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose();
        }
      }}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close about panel"
        onClick={onClose}
      />
      <div
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-card)] p-6 text-sm text-[var(--text-secondary)] shadow-xl"
        onClick={(e) => {
          e.stopPropagation();
        }}
        onKeyDown={(e) => {
          if (e.key !== "Escape") {
            e.stopPropagation();
          }
        }}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="about-demo-title" className="text-base font-semibold text-[var(--text-primary)]">
            About this demo
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
          >
            Close
          </button>
        </div>
        <p className="mb-4 leading-relaxed text-[var(--text-secondary)]">{ABOUT_COPY.reference_mapping}</p>
        <p className="mb-4 leading-relaxed text-[var(--text-secondary)]">{ABOUT_COPY.what_this_demo_shows}</p>
        <p className="mb-4 leading-relaxed text-[var(--text-secondary)]">{ABOUT_COPY.how_it_was_built}</p>
        <ul className="flex flex-col gap-2">
          {ABOUT_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent-indigo)] underline-offset-2 hover:underline"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
