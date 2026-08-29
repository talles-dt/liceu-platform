"use client";

import Link from "next/link";
import { useState } from "react";

const NAV = [
  { href: "/manifesto" as const, label: "manifesto" },
  { href: "/metodo" as const, label: "método" },
  { href: "/programa" as const, label: "programa" },
  { href: "/mentoria" as const, label: "mentoria" },
  { href: "/blog" as const, label: "blog" },
  { href: "/login" as const, label: "login" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-[var(--liceu-stone)] bg-[var(--liceu-bg)] border-l-4 border-l-[var(--liceu-accent)]">
      <div className="mx-auto flex max-w-[var(--liceu-maxw)] items-baseline justify-between gap-6 px-6 py-5">
        <Link
          href="/"
          className="font-[var(--font-space-grotesk)] text-[12px] uppercase tracking-[0.28em] text-[var(--liceu-accent)] font-black"
        >
          Liceu
        </Link>

        {/* Desktop / tablet navigation */}
        <nav className="hidden flex-wrap justify-end gap-x-5 gap-y-2 sm:flex">
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

        {/* Mobile hamburger toggle */}
        <button
          type="button"
          aria-label="Abrir menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center border border-[var(--liceu-stone)] text-[var(--liceu-accent)] sm:hidden"
        >
          <span className="font-[var(--font-space-grotesk)] text-lg leading-none">{open ? "×" : "≡"}</span>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="sm:hidden">
          <nav className="flex flex-col border-t border-[var(--liceu-stone)] px-6 py-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-[var(--liceu-stone)]/40 py-3 font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] transition-colors duration-150 hover:text-[var(--liceu-accent)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
