// Persistent footer row with API Explorer, GitHub, and Helical SDK links.

const LINKS = [
  { label: "API Explorer (Swagger)", href: "https://api.helical.manumustudio.com/docs" },
  { label: "GitHub", href: "https://github.com/manumurillo0430/helical-bio-explorer" },
  { label: "Built with Helical SDK", href: "https://helical.bio" },
] as const;

export function DashboardFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-base)] px-4 py-3 md:px-6">
      <div className="flex flex-col items-stretch gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-4 sm:gap-y-2">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center justify-center rounded-md px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
          >
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
