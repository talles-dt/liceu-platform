export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--liceu-neutral)] text-[var(--liceu-text)]">
      <div className="mx-auto min-h-screen max-w-5xl px-6 py-10 md:px-10">
        <div className="animate-pulse space-y-6">
          <div className="space-y-3 border-b border-[var(--liceu-stone)] pb-6">
            <div className="h-3 w-32 bg-[var(--liceu-surface)]" />
            <div className="h-8 w-80 max-w-full bg-[var(--liceu-surface)]" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)] px-4 py-3"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
