import Link from "next/link";
import { TypebotEmbed } from "@/components/TypebotEmbed";

export default function DiagnosticoPage() {
  return (
    <div className="min-h-screen bg-[var(--liceu-bg)] text-[var(--liceu-text)] font-[var(--font-work-sans)]">
      {/* Header Section */}
      <header className="border-b border-[var(--liceu-stone)]/20 px-6 py-10 md:px-12 md:py-16">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4">
            <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.3em] text-[var(--liceu-secondary)]">
              PHASE: DIAGNOSTIC
            </div>
            <h1 className="font-[var(--font-noto-serif)] text-5xl leading-tight md:text-7xl">
              The Sifting
            </h1>
            <p className="max-w-xl text-[var(--liceu-muted)]">
              You describe the context, the type of conflict, and the points
              where your intelligence fails under live pressure. We analyze
              structure — not charisma.
            </p>
          </div>
          <div className="flex flex-col items-start md:items-end">
            <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
              Candidate ID
            </div>
            <div className="mt-1 font-[var(--font-space-grotesk)] text-sm tracking-wider text-[var(--liceu-secondary)]">
              LDC-{new Date().getFullYear()}-{String(Math.floor(Math.random() * 9000 + 1000)).padStart(4, "0")}
            </div>
            <div className="mt-2 font-[var(--font-space-grotesk)] text-[10px] text-[var(--liceu-muted)]">
              {new Date().toLocaleDateString("pt-BR")}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Center Assessment Monolith */}
          <div className="md:col-span-8">
            <div className="rounded-sm border border-[var(--liceu-stone)]/20 bg-[var(--liceu-surface-container)] p-8 md:p-12">
              {/* Header Row */}
              <div className="mb-8 flex items-center justify-between border-b border-[var(--liceu-stone)]/10 pb-4">
                <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.25em] text-[var(--liceu-secondary)]">
                  PROMPT
                </div>
                <div className="font-[var(--font-space-grotesk)] text-[11px] tabular-nums text-[var(--liceu-muted)]">
                  EST. 45 min
                </div>
              </div>

              {/* Prompt Text */}
              <div className="mb-8 font-[var(--font-noto-serif)] text-3xl leading-snug italic text-[var(--liceu-text)]">
                "Descreva o contexto onde sua inteligência falha sob cobrança
                ao vivo. Onde a estrutura cede."
              </div>

              {/* Instructions */}
              <div className="mb-8 border-l-2 border-[var(--liceu-stone)]/30 pl-6 font-[var(--font-work-sans)] text-sm leading-relaxed text-[var(--liceu-muted)]">
                <p className="mb-2">
                  No campo abaixo ou via formul&aacute;rio interativo, detalhe:
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>O tipo de conflito que voc&ecirc; enfrenta</li>
                  <li>Os pontos de falha sob press&atilde;o</li>
                  <li>O contexto operacional real</li>
                </ul>
              </div>

              {/* Textarea */}
              <textarea
                className="mb-6 w-full rounded-sm border-b-2 border-[var(--liceu-stone)] bg-[var(--liceu-surface-container-lowest)] px-4 py-3 text-sm leading-relaxed text-[var(--liceu-text)] placeholder-[var(--liceu-muted)] transition-colors duration-200 focus:border-[var(--liceu-secondary)] focus:outline-none focus:ring-0"
                rows={8}
                placeholder="Descreva seu cen&aacute;rio aqui..."
              />

              {/* Submit Button */}
              <button
                type="button"
                className="bg-[var(--liceu-secondary-container)] px-8 py-4 font-[var(--font-space-grotesk)] text-[11px] font-bold uppercase tracking-widest text-[var(--liceu-text)] transition-colors duration-200 hover:opacity-90"
              >
                Submit Assessment
              </button>

              {/* Journey Tracker */}
              <div className="mt-10 grid grid-cols-5 gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-2 ${
                      i === 0
                        ? "bg-[var(--liceu-secondary)]"
                        : "bg-[var(--liceu-stone)]/20"
                    }`}
                  />
                ))}
              </div>
              <div className="mt-2 flex justify-between font-[var(--font-space-grotesk)] text-[9px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">
                <span>Entry</span>
                <span>Assessment</span>
                <span>Analysis</span>
                <span>Feedback</span>
                <span>Protocol</span>
              </div>

              {/* Typebot Embed */}
              <div className="mt-10 border-t border-[var(--liceu-stone)]/10 pt-8">
                <div className="mb-4 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.25em] text-[var(--liceu-muted)]">
                  Interactive Diagnostic
                </div>
                <TypebotEmbed />
              </div>
            </div>
          </div>

          {/* Diagnostics Sidebar */}
          <div className="space-y-6 md:col-span-4">
            {/* Live Diagnostics Card */}
            <div className="rounded-sm border border-[var(--liceu-stone)]/10 bg-[var(--liceu-surface-container-low)] p-6">
              <div className="mb-6 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.25em] text-[var(--liceu-muted)]">
                Live Diagnostics
              </div>
              <div className="space-y-5">
                {/* Metric 1 */}
                <div>
                  <div className="mb-2 flex justify-between font-[var(--font-space-grotesk)] text-[11px]">
                    <span className="text-[var(--liceu-text)]">Coherence</span>
                    <span className="text-[var(--liceu-secondary)]">—</span>
                  </div>
                  <div className="h-[2px] w-full bg-[var(--liceu-stone)]/20" />
                </div>
                {/* Metric 2 */}
                <div>
                  <div className="mb-2 flex justify-between font-[var(--font-space-grotesk)] text-[11px]">
                    <span className="text-[var(--liceu-text)]">Structure</span>
                    <span className="text-[var(--liceu-secondary)]">—</span>
                  </div>
                  <div className="h-[2px] w-full bg-[var(--liceu-stone)]/20" />
                </div>
                {/* Metric 3 */}
                <div>
                  <div className="mb-2 flex justify-between font-[var(--font-space-grotesk)] text-[11px]">
                    <span className="text-[var(--liceu-text)]">Pressure Index</span>
                    <span className="text-[var(--liceu-secondary)]">—</span>
                  </div>
                  <div className="h-[2px] w-full bg-[var(--liceu-stone)]/20" />
                </div>
              </div>
            </div>

            {/* Reference Image Area */}
            <div className="aspect-square w-full overflow-hidden rounded-sm border border-[var(--liceu-stone)]/10 bg-[var(--liceu-surface-container)]">
              <div className="flex h-full w-full items-center justify-center grayscale contrast-125 opacity-40">
                <div className="text-center font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                  <div className="mb-1 text-4xl opacity-30">⬡</div>
                  <div>Visual Reference</div>
                </div>
              </div>
            </div>

            {/* System Status Card */}
            <div className="rounded-sm border border-[var(--liceu-stone)]/10 bg-[var(--liceu-surface-container)] p-6">
              <div className="mb-4 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.25em] text-[var(--liceu-muted)]">
                System Status
              </div>
              <div className="space-y-3 font-[var(--font-work-sans)] text-xs text-[var(--liceu-muted)]">
                <div className="flex items-center justify-between">
                  <span>Protocol</span>
                  <span className="text-[var(--liceu-secondary)]">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Session</span>
                  <span>Open</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Latency</span>
                  <span className="tabular-nums">-- ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto mt-20 max-w-7xl border-t border-[var(--liceu-stone)]/10 px-6 py-10 opacity-60 md:px-12">
        <div className="flex flex-col gap-4 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.15em] text-[var(--liceu-muted)] md:flex-row md:items-center md:justify-between">
          <div>
            Protocol v1.0 — Verdant Scriptorium
          </div>
          <div className="flex gap-6">
            <Link href="/metodo" className="transition-colors hover:text-[var(--liceu-text)]">
              Method
            </Link>
            <Link href="/programa" className="transition-colors hover:text-[var(--liceu-text)]">
              Program
            </Link>
          </div>
          <div className="tabular-nums">
            {new Date().toISOString().split("T")[0]}
          </div>
        </div>
      </footer>
    </div>
  );
}
