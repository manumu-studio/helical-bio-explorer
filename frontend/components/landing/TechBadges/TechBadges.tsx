// Tech stack pill row with staggered entrance animation.

"use client";

import * as motion from "motion/react-client";

import { Badge } from "@/components/ui/badge";
import { TECH_BADGES } from "@/lib/constants/landingCopy";
import { cn } from "@/lib/utils/cn";
import type { TechBadgesProps } from "./TechBadges.types";

export function TechBadges({ className }: TechBadgesProps) {
  return (
    <section className={cn("px-6 py-16", className)}>
      <motion.div
        className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08 } },
        }}
      >
        {TECH_BADGES.map((badge) => (
          <motion.div
            key={badge}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
          >
            <Badge
              variant="outline"
              className="border-[var(--border)] bg-[var(--bg-card)] px-4 py-1.5 text-sm text-[var(--text-secondary)]"
            >
              {badge}
            </Badge>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
