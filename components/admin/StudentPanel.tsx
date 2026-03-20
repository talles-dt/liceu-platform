"use client";

type Props = {
  title: string;
  rows: { k: string; v: string }[];
  emphasis?: { k: string; v: string }[];
};

export function StudentPanel({ title, rows, emphasis }: Props) {
  return (
    <section className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/20">
      <header className="border-b border-[var(--liceu-stone)]/70 px-4 py-3">
        <div className="font-serif text-[16px] text-[var(--liceu-text)]">
          {title}
        </div>
      </header>
      <div className="px-4 py-4">
        {emphasis && emphasis.length > 0 && (
          <div className="mb-4 border border-[var(--liceu-accent)]/40 bg-[var(--liceu-bg)] px-3 py-3">
            <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-accent)]">
              diagnosis
            </div>
            <div className="mt-2 space-y-2">
              {emphasis.map((r) => (
                <div
                  key={r.k}
                  className="flex items-baseline justify-between gap-4"
                >
                  <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
                    {r.k}
                  </div>
                  <div className="text-right font-[var(--font-liceu-mono)] text-[12px] tabular-nums text-[var(--liceu-text)]">
                    {r.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.k} className="flex items-baseline justify-between gap-4">
              <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
                {r.k}
              </div>
              <div className="text-right font-[var(--font-liceu-mono)] text-[12px] tabular-nums text-[var(--liceu-text)]">
                {r.v}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

