export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--liceu-neutral)] text-[var(--liceu-text)]">
      <div className="mx-auto min-h-screen max-w-5xl px-6 py-10 md:px-10">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="space-y-3 border-b border-[var(--liceu-stone)] pb-6">
            <div className="h-3 w-24 bg-[var(--liceu-surface)]" />
            <div className="h-8 w-96 max-w-full bg-[var(--liceu-surface)]" />
            <div className="h-4 w-64 bg-[var(--liceu-surface)]" />
          </div>

          {/* Content skeleton */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-24 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)] px-4 py-4" />
              <div className="h-24 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)] px-4 py-4" />
            </div>
            <div className="h-48 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)] px-6 py-6" />
            <div className="h-32 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)] px-6 py-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
