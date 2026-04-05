import Link from "next/link";
import { TypebotEmbed } from "@/components/TypebotEmbed";

export default function DiagnosticoPage() {
  return (
    <div className="min-h-screen bg-[var(--liceu-bg)] text-[var(--liceu-text)] font-[var(--font-work-sans)]">
      {/* Header Section */}
      <header className="border-b border-[var(--liceu-stone)]/20 px-6 py-10 md:px-12 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.3em] text-[var(--liceu-secondary)]">
            PHASE: DIAGNOSTIC
          </div>
          <h1 className="mt-4 font-[var(--font-noto-serif)] text-5xl leading-tight md:text-7xl">
            The Sifting
          </h1>
          <p className="mt-4 max-w-xl text-[var(--liceu-muted)]">
            You describe the context, the type of conflict, and the points
            where your intelligence fails under live pressure. We analyze
            structure — not charisma.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-12 md:px-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          {/* Center Assessment Monolith */}
          <div className="md:col-span-8">
            <div className="border border-[var(--liceu-stone)]/20 bg-[var(--liceu-surface-container)] p-8 md:p-12">
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
                &ldquo;Descreva o contexto onde sua inteligência falha sob cobrança
                ao vivo. Onde a estrutura cede.&rdquo;
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

              {/* Journey Tracker */}
              <div className="mb-10 grid grid-cols-5 gap-1">
                {["Entry", "Assessment", "Analysis", "Feedback", "Protocol"].map((step, i) => (
                  <div key={step} className="relative">
                    <div
                      className={`h-2 ${
                        i === 1
                          ? "bg-[var(--liceu-accent)]"
                          : "bg-[var(--liceu-stone)]/20"
                      }`}
                    />
                    {i === 1 && (
                      <div className="absolute -top-5 left-0 font-[var(--font-space-grotesk)] text-[8px] uppercase tracking-[0.15em] text-[var(--liceu-accent)]">
                        ACTIVE
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-[var(--font-space-grotesk)] text-[9px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">
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
            <div className="border border-[var(--liceu-stone)]/10 bg-[var(--liceu-surface-container-low)] p-6">
              <div className="mb-6 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.25em] text-[var(--liceu-muted)]">
                Live Diagnostics
              </div>
              <div className="space-y-5">
                {["Coherence", "Structure", "Pressure Index"].map((metric) => (
                  <div key={metric}>
                    <div className="mb-2 flex justify-between font-[var(--font-space-grotesk)] text-[11px]">
                      <span className="text-[var(--liceu-text)]">{metric}</span>
                      <span className="text-[var(--liceu-muted)]">—</span>
                    </div>
                    <div className="h-[2px] w-full bg-[var(--liceu-stone)]/20" />
                  </div>
                ))}
              </div>
              <div className="mt-4 border-t border-[var(--liceu-stone)]/10 pt-4 font-[var(--font-work-sans)] text-xs text-[var(--liceu-muted)]">
                Metrics populate after assessment submission.
              </div>
            </div>

            {/* System Status Card */}
            <div className="border border-[var(--liceu-stone)]/10 bg-[var(--liceu-surface-container-lowest)] p-4">
              <div className="mb-3 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.25em] text-[var(--liceu-muted)]">
                System Status
              </div>
              <div className="space-y-2 font-[var(--font-work-sans)] text-xs text-[var(--liceu-muted)]">
                <div className="flex items-center justify-between">
                  <span>Protocol</span>
                  <span className="text-[var(--liceu-secondary)]">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Session</span>
                  <span>Open</span>
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
        </div>
      </footer>
    </div>
  );
}
