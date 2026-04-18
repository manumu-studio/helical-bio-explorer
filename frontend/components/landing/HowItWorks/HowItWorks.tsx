// How it works: 3 numbered pipeline steps connected by a scroll-driven SVG line.

"use client";

import { useRef } from "react";
import { useScroll, useTransform, motion } from "motion/react";

import { PIPELINE_STEPS } from "@/lib/constants/landingCopy";
import { cn } from "@/lib/utils/cn";
import type { HowItWorksProps } from "./HowItWorks.types";

export function HowItWorks({ className }: HowItWorksProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const pathLength = useTransform(scrollYProgress, [0.1, 0.6], [0, 1]);

  return (
    <section
      ref={sectionRef}
      className={cn("mx-auto max-w-5xl px-6 py-24", className)}
    >
      <h2 className="mb-16 text-center font-display text-3xl font-bold text-[var(--text-primary)]">
        How it works
      </h2>

      <div className="relative">
        {/* SVG connecting line */}
        <svg
          className="absolute top-10 left-0 hidden h-1 w-full md:block"
          viewBox="0 0 1000 2"
          preserveAspectRatio="none"
        >
          <motion.line
            x1="80"
            y1="1"
            x2="920"
            y2="1"
            stroke="var(--accent-indigo)"
            strokeWidth="2"
            style={{ pathLength }}
            strokeLinecap="round"
          />
        </svg>

        <div className="grid gap-12 md:grid-cols-3">
          {PIPELINE_STEPS.map((step) => (
            <div key={step.number} className="relative text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent-indigo)] text-lg font-bold text-white">
                {step.number}
              </div>
              <h3 className="mb-2 font-display text-xl font-semibold text-[var(--text-primary)]">
                {step.title}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
