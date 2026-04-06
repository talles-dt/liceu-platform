function Field({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
        {label}
      </div>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          "w-full resize-y border border-[var(--liceu-stone)] bg-[var(--liceu-bg)]",
          "px-3 py-2 text-[13px] leading-[1.7] text-[var(--liceu-text)]",
          "placeholder:text-[var(--liceu-muted)]/50 focus:outline-none focus:border-[var(--liceu-accent)]/50",
          mono ? "font-[var(--font-liceu-mono)]" : "font-serif",
        ].join(" ")}
      />
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
        {label}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] px-3 py-2 font-[var(--font-liceu-sans)] text-[13px] text-[var(--liceu-text)] placeholder:text-[var(--liceu-muted)]/50 focus:outline-none focus:border-[var(--liceu-accent)]/50"
      />
    </div>
  );
}

function SaveButton({ onClick, saving, saved }: { onClick: () => void; saving: boolean; saved: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={[
        "border px-4 py-2 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] transition-colors disabled:opacity-40",
        saved
          ? "border-[var(--liceu-accent)]/40 text-[var(--liceu-accent)]"
          : "border-[var(--liceu-stone)] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] hover:border-[var(--liceu-accent)]/40",
      ].join(" ")}
    >
      {saving ? "Salvando..." : saved ? "Salvo ✓" : "Salvar"}
    </button>
  );
}

export { Field, Input, SaveButton };
