import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
};

export function ReadingLayout({
  eyebrow = "LICEU",
  title,
  subtitle,
  right,
  children,
}: Props) {
  return (
    <div className="min-h-screen bg-[var(--liceu-bg)] text-[var(--liceu-text)]">
      <div className="mx-auto min-h-screen max-w-5xl px-6 py-10 md:px-10">
        <header className="mb-10 flex items-start justify-between gap-8 border-b border-[var(--liceu-stone)] pb-6">
          <div className="space-y-3">
            <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-accent)]">
              {eyebrow}
            </div>
            <h1 className="max-w-[var(--liceu-maxw)] font-[var(--font-noto-serif)] text-[32px] leading-[1.2] tracking-tight uppercase">
              {title}
            </h1>
            {subtitle && (
              <p className="max-w-[var(--liceu-maxw)] font-[var(--font-work-sans)] text-sm leading-relaxed text-[var(--liceu-muted)]">
                {subtitle}
              </p>
            )}
          </div>
          {right && <div className="hidden md:block">{right}</div>}
        </header>

        <main className="mx-auto w-full max-w-[var(--liceu-maxw)] pb-16">
          {children}
        </main>
      </div>
    </div>
  );
}

