// Landing nav: shared AppHeader with scroll-aware transparency, backdrop blur, helix hover, and about panel.

"use client";

import { useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";

import { AboutPanel } from "@/components/AboutPanel";
import { AppHeader } from "@/components/AppHeader";
import { cn } from "@/lib/utils/cn";
import { useHelixHover } from "@/components/landing/HeroCanvas";
import type { LandingNavProps } from "./LandingNav.types";

export function LandingNav({ className }: LandingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const { scrollY } = useScroll();
  const helix = useHelixHover();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  return (
    <>
      <div
        className={cn(
          "fixed top-0 right-0 left-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-[var(--border)] bg-[var(--bg-base)]/80 backdrop-blur-md"
            : "bg-transparent",
          className,
        )}
      >
        <AppHeader
          transparent
          onAboutOpen={() => setAboutOpen(true)}
          interactionHandlers={{
            onMouseEnter: helix.onMouseEnter,
            onMouseLeave: helix.onMouseLeave,
          }}
        />
      </div>
      <AboutPanel open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  );
}
