// Shared header: logo + branding left, theme toggle + about button + optional right slot.
// Used by both the landing page and the dashboard shell.

"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { APP_DISPLAY_NAME, APP_DISPLAY_NAME_SHORT } from "@/lib/constants/appBranding";
import { cn } from "@/lib/utils/cn";
import type { AppHeaderProps } from "./AppHeader.types";

export function AppHeader({
  rightSlot,
  className,
  transparent,
  onAboutOpen,
  interactionHandlers,
}: AppHeaderProps) {
  const { resolvedTheme, theme } = useTheme();
  const effectiveTheme = resolvedTheme ?? theme ?? "dark";
  const logoSrc =
    effectiveTheme === "light" ? "/assets/logo-black.webp" : "/assets/logo-white.webp";

  return (
    <header
      className={cn(
        "flex items-center justify-between gap-2 px-3 py-2 md:px-6 md:py-3",
        !transparent && "border-b border-[var(--border)] bg-[var(--bg-base)]",
        className,
      )}
    >
      {/* ── Logo + branding ── */}
      <Link
        href="/"
        aria-label="Home"
        className="flex min-w-0 max-w-[min(100%,42rem)] flex-1 items-center gap-2 rounded-lg p-1.5 outline-none transition-opacity hover:opacity-70 focus-visible:ring-2 focus-visible:ring-[var(--accent-indigo)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] sm:gap-3"
        {...(interactionHandlers && {
          onMouseEnter: interactionHandlers.onMouseEnter,
          onMouseLeave: interactionHandlers.onMouseLeave,
        })}
      >
        <Image
          key={logoSrc}
          src={logoSrc}
          alt=""
          width={40}
          height={40}
          className="h-7 w-7 shrink-0 opacity-90 md:h-10 md:w-10"
          priority
        />
        <span className="line-clamp-2 text-xs font-semibold leading-snug tracking-tight text-[var(--text-primary)] md:hidden">
          {APP_DISPLAY_NAME_SHORT}
        </span>
        <span className="hidden text-sm font-semibold tracking-tight text-[var(--text-primary)] md:inline md:text-base">
          {APP_DISPLAY_NAME}
        </span>
      </Link>

      {/* ── Right side: theme toggle + about + optional extras ── */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <ThemeToggle
          {...(interactionHandlers && {
            onMouseEnter: interactionHandlers.onMouseEnter,
            onMouseLeave: interactionHandlers.onMouseLeave,
          })}
        />
        {onAboutOpen && (
          <button
            type="button"
            onClick={onAboutOpen}
            className="rounded-full border border-[var(--border)] p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
            aria-label="About this demo"
            onMouseEnter={interactionHandlers?.onMouseEnter}
            onMouseLeave={interactionHandlers?.onMouseLeave}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="h-4 w-4"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
          </button>
        )}
        {rightSlot}
        <a
          href="https://github.com/manumu-studio/helical-bio-explorer"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          aria-label="View source on GitHub"
          onMouseEnter={interactionHandlers?.onMouseEnter}
          onMouseLeave={interactionHandlers?.onMouseLeave}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
        </a>
      </div>
    </header>
  );
}
