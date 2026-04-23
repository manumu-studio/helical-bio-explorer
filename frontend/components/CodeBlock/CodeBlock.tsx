// Syntax-highlighted code snippet with a VS Code-inspired palette for light & dark themes.

"use client";

import { useMemo } from "react";

import type { TokenType } from "@/lib/request-trace";
import { highlight } from "@/lib/request-trace";

import type { CodeBlockProps } from "./CodeBlock.types";

// Arbitrary-value Tailwind classes keep everything in className (no inline
// styles) so the dark-variant swap is a single class compile-time.
const TOKEN_CLASS: Record<TokenType, string> = {
  text: "text-[#1f2328] dark:text-[#d4d4d4]",
  comment: "italic text-[#008000] dark:text-[#6a9955]",
  string: "text-[#a31515] dark:text-[#ce9178]",
  number: "text-[#098658] dark:text-[#b5cea8]",
  keyword: "text-[#af00db] dark:text-[#c586c0]",
  storage: "text-[#0000ff] dark:text-[#569cd6]",
  builtin: "text-[#267f99] dark:text-[#4ec9b0]",
  function: "text-[#795e26] dark:text-[#dcdcaa]",
  decorator: "text-[#795e26] dark:text-[#dcdcaa]",
  variable: "text-[#001080] dark:text-[#9cdcfe]",
};

export function CodeBlock({ code, language }: CodeBlockProps) {
  const tokens = useMemo(() => highlight(code, language), [code, language]);

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-3 py-1.5">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
          {language}
        </span>
      </div>
      <pre className="overflow-x-auto p-3 text-sm leading-relaxed">
        <code className="font-mono">
          {tokens.map((t, i) => (
            <span key={i} className={TOKEN_CLASS[t.type]}>
              {t.text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
