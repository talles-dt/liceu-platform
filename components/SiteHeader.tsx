import Link from "next/link";

const NAV = [
  { href: "/manifesto" as const, label: "manifesto" },
  { href: "/metodo" as const, label: "método" },
  { href: "/programa" as const, label: "programa" },
  { href: "/mentoria" as const, label: "mentoria" },
  { href: "/blog" as const, label: "blog" },
  { href: "/login" as const, label: "login" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--liceu-stone)] bg-[var(--liceu-bg)] border-l-4 border-l-[var(--liceu-accent)]">
      <div className="mx-auto flex max-w-[var(--liceu-maxw)] items-baseline justify-between gap-6 px-6 py-5">
        <Link
          href="/"
          className="font-[var(--font-space-grotesk)] text-[12px] uppercase tracking-[0.28em] text-[var(--liceu-accent)] font-black"
        >
          Liceu
        </Link>

        <nav className="flex flex-wrap justify-end gap-x-5 gap-y-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] transition-colors duration-150 hover:text-[var(--liceu-accent)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

