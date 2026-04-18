// Landing hero: Fraunces headline, Geist Mono eyebrow, dual CTAs with helix hover, and procedural canvas background.

"use client";

import Image from "next/image";
import Link from "next/link";
import * as motion from "motion/react-client";

import { Button } from "@/components/ui/button";
import { HeroCanvas, useHelixHover } from "@/components/landing/HeroCanvas";
import { HERO_COPY, FOOTER_LINKS } from "@/lib/constants/landingCopy";
import { cn } from "@/lib/utils/cn";
import type { LandingHeroProps } from "./LandingHero.types";

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      role="status"
      aria-label="Loading"
    />
  );
}

export function LandingHero({ className }: LandingHeroProps) {
  const primary = useHelixHover();
  const secondary = useHelixHover();

  return (
    <section
      className={cn(
        "relative flex min-h-screen items-center justify-center overflow-hidden px-6",
        className,
      )}
    >
      <HeroCanvas />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.p
          className="mb-6 font-mono text-xs tracking-[0.25em] text-[var(--accent-indigo)] uppercase"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {HERO_COPY.eyebrow}
        </motion.p>

        <motion.h1
          className="mb-6 font-display text-4xl font-bold leading-tight text-[var(--text-primary)] sm:text-5xl md:text-6xl"
          style={{ fontOpticalSizing: "auto" }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {HERO_COPY.headline}
        </motion.h1>

        <motion.p
          className="mx-auto mb-10 max-w-2xl text-lg text-[var(--text-secondary)]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {HERO_COPY.subline}
        </motion.p>

        <motion.div
          className="flex items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Button
            asChild={!primary.isLoading}
            size="default"
            onMouseEnter={primary.onMouseEnter}
            onMouseLeave={primary.onMouseLeave}
            onClick={primary.onClick}
            disabled={primary.isLoading}
          >
            {primary.isLoading ? (
              <Spinner />
            ) : (
              <Link href="/dashboard">{HERO_COPY.ctaPrimary}</Link>
            )}
          </Button>
          <Button
            asChild
            variant="outline"
            size="default"
            onMouseEnter={secondary.onMouseEnter}
            onMouseLeave={secondary.onMouseLeave}
          >
            <a
              href={FOOTER_LINKS.github.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {HERO_COPY.ctaSecondary}
            </a>
          </Button>
        </motion.div>

        <motion.a
          href="https://helical.bio"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 opacity-80 transition-opacity hover:opacity-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.8 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          onMouseEnter={secondary.onMouseEnter}
          onMouseLeave={secondary.onMouseLeave}
        >
          <span className="text-sm tracking-wide text-[var(--text-secondary)]">
            Powered by
          </span>
          <Image
            src="/assets/logo-helical.webp"
            alt="Helical AI"
            width={28}
            height={28}
            className="h-6 w-6 rounded-full opacity-60 dark:invert"
          />
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            Helical AI
          </span>
        </motion.a>
      </div>

      <motion.div
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5, y: [0, 8, 0] }}
        transition={{ opacity: { duration: 1, delay: 1.2 }, y: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-6 w-6 text-[var(--text-secondary)]"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
        </svg>
      </motion.div>
    </section>
  );
}
