"use client";

type Props = {
  title: string;
  meta: { k: string; v: string }[];
  text: string;
  aiFeedback?: { score?: number; feedback?: string; status?: string };
};

export function AssignmentReviewPanel({ title, meta, text, aiFeedback }: Props) {
  return (
    <section className="border border-[var(--liceu-stone)] bg-[var(--liceu-bg)]">
      <header className="border-b border-[var(--liceu-stone)]/70 px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <div className="font-serif text-[16px] text-[var(--liceu-text)]">
            {title}
          </div>
          {aiFeedback?.status && (
            <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-accent)]">
              {aiFeedback.status}
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 px-4 py-4 md:grid-cols-[1fr_360px]">
        <article className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/18 px-4 py-4">
          <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            manuscript
          </div>
          <div className="mt-3 whitespace-pre-wrap font-serif text-[14px] leading-[1.85] text-[var(--liceu-text)]">
            {text}
          </div>
        </article>

        <aside className="space-y-3">
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/20 px-4 py-4">
            <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              metadata
            </div>
            <div className="mt-3 space-y-2">
              {meta.map((r) => (
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

          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/20 px-4 py-4">
            <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              AI feedback
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-baseline justify-between gap-4">
                <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
                  score
                </div>
                <div className="text-right font-[var(--font-liceu-mono)] text-[12px] tabular-nums text-[var(--liceu-text)]">
                  {aiFeedback?.score ?? "—"}
                </div>
              </div>
              <div className="border-t border-[var(--liceu-stone)]/70 pt-2 font-serif text-[13px] leading-[1.8] text-[var(--liceu-text)]">
                {aiFeedback?.feedback ?? "No automated feedback available."}
              </div>
            </div>
          </div>

          <div className="border border-[var(--liceu-accent)]/35 bg-[var(--liceu-bg)] px-4 py-4">
            <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-accent)]">
              operator override
            </div>
            <div className="mt-2 font-[var(--font-liceu-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
              UI only. Wire to an approval endpoint when assignments schema is
              finalized.
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {["approve", "revision", "reject"].map((x) => (
                <button
                  key={x}
                  type="button"
                  className={[
                    "border border-[var(--liceu-stone)] px-2 py-2",
                    "bg-[var(--liceu-surface)]/25 hover:bg-[var(--liceu-surface)]/35",
                    "font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em]",
                    "text-[var(--liceu-text)]",
                  ].join(" ")}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

