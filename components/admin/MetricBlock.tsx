type Props = {
  label: string;
  value: string | number;
  note?: string;
  highlight?: boolean;
};

export function MetricBlock({ label, value, note, highlight }: Props) {
  return (
    <div
      className={[
        "border border-[var(--liceu-stone)] border-l-4 bg-[var(--liceu-surface)] px-4 py-3",
        highlight ? "border-l-[var(--liceu-accent)]" : "border-l-[var(--liceu-stone)]",
      ].join(" ")}
    >
      <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
        {label}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <div
          className={[
            "font-[var(--font-space-grotesk)] text-[22px] leading-none tabular-nums",
            highlight ? "text-[var(--liceu-accent)]" : "text-[var(--liceu-text)]",
          ].join(" ")}
        >
          {value}
        </div>
      </div>
      {note && (
        <div className="mt-2 font-[var(--font-work-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
          {note}
        </div>
      )}
    </div>
  );
}

