export function BottomStatusBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-8 border-t border-[var(--liceu-stone)] bg-[var(--liceu-bg)] flex items-center px-4 gap-6">
      <div className="font-[var(--font-space-grotesk)] text-[9px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
        <span className="text-[var(--liceu-accent)]">●</span> Latency: 42ms
      </div>
      <div className="font-[var(--font-space-grotesk)] text-[9px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
        Cognitive Sync: <span className="text-[var(--liceu-accent)]">Active</span>
      </div>
      <div className="font-[var(--font-space-grotesk)] text-[9px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
        Clearance: <span className="text-[var(--liceu-secondary)]">Level 2</span>
      </div>
      <div className="flex-1" />
      <div className="font-[var(--font-space-grotesk)] text-[9px] uppercase tracking-[0.18em] text-[var(--liceu-muted)] animate-pulse">
        _
      </div>
    </div>
  );
}
