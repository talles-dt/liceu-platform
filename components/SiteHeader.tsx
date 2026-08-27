"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/lib/hooks/useMobile";

const NAV = [
  { href: "/manifesto" as const, label: "manifesto" },
  { href: "/metodo" as const, label: "m\u00e9todo" },
  { href: "/programa" as const, label: "programa" },
  { href: "/mentoria" as const, label: "mentoria" },
  { href: "/blog" as const, label: "blog" },
  { href: "/login" as const, label: "login" },
] as const;

export function SiteHeader() {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    if (!isMobile) setOpen(false);
  }, [isMobile]);

  if (isMobile) {
    return (
      <header className="border-b border-[var(--liceu-stone)] bg-[var(--liceu-bg)] border-l-4 border-l-[var(--liceu-accent)] sticky top-0 z-50">
        <div className="mx-auto flex max-w-[var(--liceu-maxw)] items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="font-[var(--font-space-grotesk)] text-[12px] uppercase tracking-[0.28em] text-[var(--liceu-accent)] font-black"
          >
            Liceu
          </Link>

          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded focus:outline-none focus:ring-2 focus:ring-[var(--liceu-accent)]"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg
              className="w-6 h-6 text-[var(--liceu-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {open ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {open && (
          <nav className="border-t border-[var(--liceu-stone)] bg-[var(--liceu-bg)]">
            <div className="px-4 py-3">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-3 font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] hover:text-[var(--liceu-accent)] transition-colors border-b border-[var(--liceu-stone)]/15 last:border-0"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>
    );
  }

  // Desktop version
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
