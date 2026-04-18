// Wraps next-themes ThemeProvider with app-specific defaults (class strategy, dark default).

"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

interface ThemeProviderProps {
  readonly children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      storageKey="helical-explorer-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
