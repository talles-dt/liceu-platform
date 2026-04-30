import Link from "next/link";
import { MinimalButton } from "@/components/MinimalButton";
import { POSTS } from "@/lib/blog";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--liceu-bg)] text-[var(--liceu-text)]">
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 h-20 border-b border-[var(--liceu-stone)] border-l-4 border-l-[var(--liceu-accent)] bg-[var(--liceu-surface)]">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className="font-[var(--font-noto-serif)] text-2xl font-black uppercase tracking-tight text-[var(--liceu-accent)]"
          >
            Liceu Underground
          </Link>

          <nav className="flex items-center gap-6">
            {([
              { href: "/metodo", label: "Método" },
              { href: "/programa", label: "Programa" },
              { href: "/mentoria", label: "Mentoria" },
            ] as const).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] transition-colors hover:text-[var(--liceu-accent)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section - The Monolith */}
        <section className="relative flex min-h-[92vh] flex-col items-center justify-center bg-[var(--liceu-surface-container-low)] px-6 py-32">
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--liceu-bg)] via-transparent to-transparent" />

          <div className="relative z-10 flex max-w-4xl flex-col items-center text-center">
            <div className="mb-8 bg-[var(--liceu-primary-container)] px-4 py-1 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.3em] text-[var(--liceu-text)]">
              The Brutalist Archive
            </div>

            <h1 className="font-[var(--font-noto-serif)] text-5xl font-black uppercase tracking-tighter leading-none md:text-7xl lg:text-8xl">
              Você é inteligente.{" "}
              <span className="text-[var(--liceu-accent)]">Sob pressão, não parece.</span>
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-[var(--liceu-muted)]">
              Uma escola de pensamento aplicado à fala. Fundada na retórica clássica.
              Construída para quem colapsa onde mais importa.
            </p>

            <div className="mt-12 flex flex-col items-center gap-6">
              <div className="h-1 w-16 bg-[var(--liceu-secondary)]" />
              <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                Access Required
              </div>
              <div className="flex gap-4">
                <Link href="/diagnostico">
                  <MinimalButton variant="primary">Iniciar diagnóstico</MinimalButton>
                </Link>
                <Link href="/manifesto">
                  <MinimalButton variant="quiet">Ler manifesto</MinimalButton>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Three Pillars */}
        <section className="py-32">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-0 md:grid-cols-3">
            {[
              {
                title: "Não é",
                items: ["Curso de oratória", "Técnica de palco", "Dicas de postura", "Motivação"],
              },
              {
                title: "É",
                items: ["Treinamento de estrutura lógica", "Pressão progressiva controlada", "Retórica clássica aplicada", "Método — não performance"],
              },
              {
                title: "Para quem",
                items: ["Colapsa sob interrupção", "Sabe mais do que consegue defender", "Perde terreno para quem blafa", "Quer a estrutura, não o carisma"],
              },
            ].map((col, idx) => (
              <div
                key={col.title}
                className={`group relative bg-[var(--liceu-surface-container)] p-12 transition-colors hover:bg-[var(--liceu-surface-container-high)] ${
                  idx === 1 ? "md:-translate-y-8" : ""
                } border-l border-[var(--liceu-stone)]/15`}
              >
                <div className="absolute top-0 left-0 h-0 w-1 bg-[var(--liceu-accent)] transition-all duration-700 group-hover:h-full" />
                <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                  {col.title}
                </div>
                <ul className="mt-6 space-y-4">
                  {col.items.map((item) => (
                    <li key={item} className="font-[var(--font-noto-serif)] text-[13px] leading-snug text-[var(--liceu-text)]">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Diagnostic CTA */}
        <section className="relative bg-[var(--liceu-surface-container-lowest)] py-32">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 md:grid-cols-2">
            <div className="relative surface-scriptorium p-12">
              <h2 className="font-[var(--font-noto-serif)] text-3xl font-bold uppercase">
                Diagnóstico técnico
              </h2>
              <p className="mt-4 text-[var(--liceu-muted)]">
                Avaliação precisa de onde e por que sua inteligência falha sob cobrança.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Identificação de pontos de colapso",
                  "Análise de estrutura argumentativa",
                  "Recomendação de módulo de entrada",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 bg-[var(--liceu-accent)]" />
                    <span className="text-sm text-[var(--liceu-muted)]">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/diagnostico">
                  <button className="bg-[var(--liceu-secondary-container)] px-8 py-4 font-[var(--font-space-grotesk)] text-xs font-black uppercase tracking-[0.3em] text-[var(--liceu-text)] transition-colors hover:bg-[var(--liceu-secondary)] hover:text-[var(--liceu-on-secondary-container)]">
                    Iniciar diagnóstico
                  </button>
                </Link>
              </div>
            </div>

            <div className="relative aspect-square border-l-4 border-[var(--liceu-accent)] bg-[var(--liceu-surface-container-high)]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border border-[var(--liceu-accent)]/20 bg-[var(--liceu-bg)]/80 p-8 text-center backdrop-blur-xl">
                  <p className="font-[var(--font-noto-serif)] text-2xl italic text-[var(--liceu-text)]">
                    A inteligência sem estrutura é como uma espada sem cabo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="py-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12 font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Caminhos de entrada
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {([
                {
                  href: "/diagnostico",
                  tag: "GRATUITO",
                  title: "Diagnóstico técnico",
                  desc: "Avaliação tática do colapso. Por onde começar.",
                },
                {
                  href: "/programa",
                  tag: "R$ 149 — R$ 1.297",
                  title: "Programa",
                  desc: "Ebook ou aulas em vídeo. Progressão estrita.",
                },
                {
                  href: "/mentoria",
                  tag: "R$ 4.999 — SELETIVO",
                  title: "Mentoria individual",
                  desc: "Correção ao vivo. Seis sessões.",
                },
              ] as const).map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="group block border border-[var(--liceu-stone)] border-l-4 border-l-[var(--liceu-stone)] bg-[var(--liceu-surface-container)] p-8 transition-all hover:border-l-[var(--liceu-accent)] hover:bg-[var(--liceu-surface-container-high)]"
                >
                  <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                    {p.tag}
                  </div>
                  <div className="mt-4 font-[var(--font-noto-serif)] text-xl uppercase text-[var(--liceu-text)] group-hover:text-[var(--liceu-accent)]">
                    {p.title}
                  </div>
                  <p className="mt-2 text-sm text-[var(--liceu-muted)]">{p.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Recent essays */}
        {POSTS.length > 0 && (
          <section className="border-t border-[var(--liceu-stone)] py-32">
            <div className="mx-auto max-w-7xl px-6">
              <div className="mb-12 flex items-baseline justify-between">
                <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                  Ensaios
                </div>
                <Link
                  href="/blog"
                  className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] underline underline-offset-4 hover:text-[var(--liceu-accent)]"
                >
                  Ver todos
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {POSTS.slice(0, 2).map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group block border border-[var(--liceu-stone)] bg-[var(--liceu-surface-container-high)] p-8 transition-colors hover:bg-[var(--liceu-surface-container)]"
                  >
                    <div className="font-[var(--font-noto-serif)] text-lg uppercase text-[var(--liceu-text)] group-hover:text-[var(--liceu-accent)]">
                      {post.title}
                    </div>
                    <div className="mt-4 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
                      {post.date}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Bottom Status Bar */}
      <div className="fixed bottom-0 left-0 right-0 flex h-8 items-center border-t border-[var(--liceu-stone)]/15 bg-[var(--liceu-surface)] px-4">
        <div className="flex-1" />
        <div className="font-[var(--font-space-grotesk)] text-[9px] uppercase tracking-[0.18em] text-[var(--liceu-muted)] animate-pulse">
          Liceu Underground _
        </div>
      </div>
    </div>
  );
}
