// 3-column footer: logo + tagline, link columns, interview tag.

import { APP_DISPLAY_NAME } from "@/lib/constants/appBranding";
import { FOOTER_LINKS } from "@/lib/constants/landingCopy";
import { cn } from "@/lib/utils/cn";
import type { LandingFooterProps } from "./LandingFooter.types";

export function LandingFooter({ className }: LandingFooterProps) {
  return (
    <footer
      className={cn("border-t border-[var(--border)] px-6 py-12", className)}
    >
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
        {/* Brand */}
        <div>
          <p className="font-semibold text-[var(--text-primary)]">{APP_DISPLAY_NAME}</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Single-cell foundation models applied to reference-mapping.
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold tracking-wide text-[var(--text-secondary)] uppercase">
            Links
          </p>
          {Object.values(FOOTER_LINKS).map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Meta */}
        <div className="flex flex-col justify-end text-right">
          <p className="text-xs text-[var(--text-secondary)]">
            Built for Helical AI R2 interview · 2026
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            © {new Date().getFullYear()} Manu Murillo
          </p>
        </div>
      </div>
    </footer>
  );
}
