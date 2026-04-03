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
        "border border-[var(--liceu-stone)] bg-[var(--liceu-surface)] px-4 py-3",
        highlight ? "border-[var(--liceu-secondary)]" : "",
      ].join(" ")}
    >
      <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
        {label}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <div
          className={[
            "font-[var(--font-space-grotesk)] text-[22px] leading-none tabular-nums",
            highlight ? "text-[var(--liceu-secondary)]" : "text-[var(--liceu-text)]",
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

