// SVG sun/moon theme toggle with 180° rotation animation. Respects prefers-reduced-motion.

"use client";

import { cn } from "@/lib/utils/cn";
import type { ThemeToggleProps } from "./ThemeToggle.types";
import { useThemeToggle } from "./useThemeToggle";

export function ThemeToggle({ className, onMouseEnter, onMouseLeave }: ThemeToggleProps) {
  const { isDark, mounted, prefersReducedMotion, toggle } = useThemeToggle();

  if (!mounted) {
    return <div className={cn("h-8 w-8", className)} />;
  }

  const rotationStyle = prefersReducedMotion
    ? undefined
    : {
        transform: isDark ? "rotate(0deg)" : "rotate(180deg)",
        transition: "transform 300ms ease-in-out",
      };

  return (
    <button
      type="button"
      onClick={toggle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md",
        "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        "hover:bg-[var(--bg-elevated)] transition-colors",
        className,
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        style={rotationStyle}
        aria-hidden
      >
        {isDark ? (
          <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        ) : (
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        )}
      </svg>
    </button>
  );
}
