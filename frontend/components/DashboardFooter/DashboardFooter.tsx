// Persistent footer row with API Explorer, GitHub, and Helical SDK links.

const LINKS = [
  { label: "API Explorer (Swagger)", href: "https://api.helical.manumustudio.com/docs" },
  { label: "GitHub", href: "https://github.com/manumurillo0430/helical-bio-explorer" },
  { label: "Built with Helical SDK", href: "https://helical.bio" },
] as const;

export function DashboardFooter() {
  return (
    <footer className="border-t border-slate-800 px-6 py-3">
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-300"
          >
            {link.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
