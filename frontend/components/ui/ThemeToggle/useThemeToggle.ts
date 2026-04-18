// Theme toggle state: resolves current theme from next-themes and checks reduced-motion preference.

"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeToggleState {
  readonly isDark: boolean;
  readonly mounted: boolean;
  readonly prefersReducedMotion: boolean;
  readonly toggle: () => void;
}

export function useThemeToggle(): ThemeToggleState {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    mq.addEventListener("change", handler);
    return () => {
      mq.removeEventListener("change", handler);
    };
  }, []);

  const toggle = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return {
    isDark: resolvedTheme === "dark",
    mounted,
    prefersReducedMotion,
    toggle,
  };
}
