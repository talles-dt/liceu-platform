import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
};

export function ChartContainer({ title, subtitle, right, children }: Props) {
  return (
    <section className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]">
      <header className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[var(--liceu-stone)]/70 px-4 py-3">
        <div className="min-w-0">
          <div className="font-[var(--font-noto-serif)] text-[16px] leading-snug text-[var(--liceu-text)]">
            {title}
          </div>
          {subtitle && (
            <div className="mt-1 font-[var(--font-work-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
              {subtitle}
            </div>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </header>
      <div className="px-4 py-4">{children}</div>
    </section>
  );
}

