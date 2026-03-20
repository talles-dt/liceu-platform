import Link from "next/link";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";
import { POSTS } from "@/lib/blog";

export default function HomePage() {
  return (
    <ReadingLayout
      eyebrow="LICEU UNDERGROUND"
      title="Você é inteligente. Sob pressão, não parece."
      subtitle="Uma escola de pensamento aplicado à fala. Fundada na retórica clássica. Construída para quem colapsa onde mais importa."
    >
      <div className="space-y-14">

        {/* Lede */}
        <section className="space-y-5 font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
          <p>
            Existe um tipo específico de fracasso que ninguém nomeia com precisão.
            Não é incompetência. É o momento em que a inteligência que te distingue
            no trabalho silencioso — na análise, no relatório, na ideia que todos
            aceitam depois — desmorona exatamente quando há peso real na barra.
            Na reunião difícil. Na cobrança ao vivo. Na discordância com o diretor.
          </p>
          <p>
            O sistema nervoso trava. A voz sobe. Você se explica demais ou não
            consegue articular nada. A resposta certa aparece meia hora depois,
            no elevador.
          </p>
          <p>
            O Liceu Underground existe para esse problema específico.
            Não para te transformar em orador. Para construir a estrutura
            interna que impede o colapso.
          </p>
        </section>

        {/* Primary CTA */}
        <section className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-6 py-6 space-y-4">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Porta de entrada
          </div>
          <p className="font-serif text-[17px] leading-[1.7] text-[var(--liceu-text)]">
            O diagnóstico técnico é gratuito. É uma avaliação precisa de onde e
            por que sua inteligência falha sob cobrança. Sem palco. Sem truque.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link href="/diagnostico">
              <MinimalButton>Fazer o diagnóstico gratuito</MinimalButton>
            </Link>
            <Link href="/manifesto">
              <MinimalButton variant="quiet">Ler o manifesto</MinimalButton>
            </Link>
          </div>
        </section>

        {/* What this is */}
        <section className="space-y-6 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            O que é o Liceu
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                label: "Não é",
                items: ["Curso de oratória", "Técnica de palco", "Dicas de postura", "Motivação"],
              },
              {
                label: "É",
                items: ["Treinamento de estrutura lógica", "Pressão progressiva controlada", "Retórica clássica aplicada", "Método — não performance"],
              },
              {
                label: "Para quem",
                items: ["Colapsa sob interrupção", "Sabe mais do que consegue defender", "Perde terreno para quem blafa", "Quer a estrutura, não o carisma"],
              },
            ].map((col) => (
              <div key={col.label} className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/25 px-4 py-4 space-y-3">
                <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                  {col.label}
                </div>
                <ul className="space-y-2">
                  {col.items.map((item) => (
                    <li key={item} className="font-serif text-[13px] leading-snug text-[var(--liceu-text)]">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Products */}
        <section className="space-y-6 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Caminhos de entrada
          </div>
          <div className="space-y-3">
            {[
              {
                href: "/diagnostico",
                tag: "GRATUITO",
                title: "Diagnóstico técnico",
                desc: "Avaliação tática do colapso. Por onde começar.",
              },
              {
                href: "/programa",
                tag: "R$ 149 — R$ 1.297",
                title: "Programa — seis módulos",
                desc: "Ebook ou aulas em vídeo. Progressão estrita. Retórica clássica como treinamento de força.",
              },
              {
                href: "/mentoria",
                tag: "R$ 4.999 — SELETIVO",
                title: "Mentoria individual",
                desc: "Correção ao vivo. Seis sessões. Entrada por entrevista.",
              },
            ].map((p) => (
              <Link
                key={p.href}
                href={p.href as never}
                className="group flex flex-wrap items-start justify-between gap-4 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/25 px-5 py-5 hover:bg-[var(--liceu-surface)]/50 transition-colors"
              >
                <div className="space-y-2">
                  <div className="font-serif text-[18px] text-[var(--liceu-text)] group-hover:underline decoration-[var(--liceu-accent)] underline-offset-4">
                    {p.title}
                  </div>
                  <p className="font-[var(--font-liceu-sans)] text-[12px] text-[var(--liceu-muted)]">
                    {p.desc}
                  </p>
                </div>
                <div className="shrink-0 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                  {p.tag}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Recent essays */}
        {POSTS.length > 0 && (
          <section className="space-y-5 border-t border-[var(--liceu-stone)]/70 pt-10">
            <div className="flex items-baseline justify-between gap-6">
              <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                Ensaios
              </div>
              <Link
                href="/blog"
                className="font-[var(--font-liceu-mono)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)] underline underline-offset-4 hover:text-[var(--liceu-text)]"
              >
                Ver todos
              </Link>
            </div>
            <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/25">
              <ul className="divide-y divide-[var(--liceu-stone)]/70">
                {POSTS.slice(0, 2).map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}` as never}
                      className="flex flex-wrap items-baseline justify-between gap-4 px-5 py-4 hover:bg-[var(--liceu-surface)]/40 transition-colors"
                    >
                      <span className="font-serif text-[16px] text-[var(--liceu-text)]">
                        {post.title}
                      </span>
                      <span className="font-[var(--font-liceu-mono)] text-[10px] tracking-[0.18em] text-[var(--liceu-muted)]">
                        {post.date}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

      </div>
    </ReadingLayout>
  );
}
