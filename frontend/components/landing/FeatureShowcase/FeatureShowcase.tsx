// Feature showcase: 4 alternating-layout cards for each dashboard tab with whileInView animations.

"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import * as motion from "motion/react-client";

import { FEATURE_CARDS } from "@/lib/constants/landingCopy";
import { cn } from "@/lib/utils/cn";
import type { FeatureShowcaseProps } from "./FeatureShowcase.types";

export function FeatureShowcase({ className }: FeatureShowcaseProps) {
  const { resolvedTheme, theme } = useTheme();
  const effectiveTheme = resolvedTheme ?? theme ?? "light";
  return (
    <section className={cn("mx-auto max-w-6xl px-6 py-24", className)}>
      <h2 className="mb-16 text-center font-display text-3xl font-bold text-[var(--text-primary)]">
        Four views, one workflow
      </h2>

      <div className="flex flex-col gap-20">
        {FEATURE_CARDS.map((card, i) => {
          const isReversed = i % 2 === 1;
          return (
            <motion.div
              key={card.title}
              className={cn(
                "flex flex-col items-center gap-8 md:flex-row",
                isReversed ? "md:flex-row-reverse" : "",
              )}
              initial={{ opacity: 0, x: isReversed ? 40 : -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="flex-1 space-y-4">
                <h3 className="font-display text-2xl font-semibold text-[var(--text-primary)]">
                  {card.title}
                </h3>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {card.body}
                </p>
              </div>

              <div className="flex-1">
                <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/60 p-2 backdrop-blur-md">
                  <Image
                    src={effectiveTheme === "light" ? card.imageLight : card.imageDark}
                    alt={`${card.title} dashboard tab screenshot`}
                    width={600}
                    height={400}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
