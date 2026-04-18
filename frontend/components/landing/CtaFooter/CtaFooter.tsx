// Gradient CTA panel with dot-grid overlay, centered call-to-action, and helix hover trigger.

"use client";

import Link from "next/link";
import * as motion from "motion/react-client";

import { Button } from "@/components/ui/button";
import { useHelixHover } from "@/components/landing/HeroCanvas";
import { CTA_FOOTER_COPY } from "@/lib/constants/landingCopy";
import { cn } from "@/lib/utils/cn";
import type { CtaFooterProps } from "./CtaFooter.types";

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      role="status"
      aria-label="Loading"
    />
  );
}

export function CtaFooter({ className }: CtaFooterProps) {
  const helix = useHelixHover();

  return (
    <section
      className={cn("relative overflow-hidden px-6 py-24", className)}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-indigo)]/15 via-transparent to-[var(--accent-violet)]/15" />

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <motion.div
        className="relative mx-auto max-w-2xl text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="mb-4 font-display text-3xl font-bold text-[var(--text-primary)]">
          {CTA_FOOTER_COPY.headline}
        </h2>
        <p className="mb-8 text-lg text-[var(--text-secondary)]">
          {CTA_FOOTER_COPY.subline}
        </p>
        <Button
          asChild={!helix.isLoading}
          onMouseEnter={helix.onMouseEnter}
          onMouseLeave={helix.onMouseLeave}
          onClick={helix.onClick}
          disabled={helix.isLoading}
        >
          {helix.isLoading ? (
            <Spinner />
          ) : (
            <Link href="/dashboard">{CTA_FOOTER_COPY.cta} →</Link>
          )}
        </Button>
      </motion.div>
    </section>
  );
}
