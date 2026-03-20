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
        "border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/25 px-4 py-3",
        highlight ? "border-[var(--liceu-accent)]/45" : "",
      ].join(" ")}
    >
      <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
        {label}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <div
          className={[
            "font-[var(--font-liceu-mono)] text-[22px] leading-none tabular-nums",
            highlight ? "text-[var(--liceu-accent)]" : "text-[var(--liceu-text)]",
          ].join(" ")}
        >
          {value}
        </div>
      </div>
      {note && (
        <div className="mt-2 font-[var(--font-liceu-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
          {note}
        </div>
      )}
    </div>
  );
}

