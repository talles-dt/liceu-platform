"use client";

import Link from "next/link";
import { MinimalButton } from "@/components/MinimalButton";
import { POSTS } from "@/lib/blog";
import { Magnetic } from "@/components/Magnetic";
import { TextReveal } from "@/components/TextReveal";
import { ParallaxLayer } from "@/components/ParallaxLayer";
import RecoveryRedirect from "./RecoveryRedirect";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--liceu-bg)] text-[var(--liceu-text)]">
      <RecoveryRedirect />
      {/* Top App Bar */}
      <header className="sticky top-0 z-40 h-16 md:h-20 border-b border-[var(--liceu-stone)] border-l-4 border-l-[var(--liceu-accent)] bg-[var(--liceu-surface)]">
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 md:px-6">
          <Link
            href="/"
            className="font-[var(--font-noto-serif)] text-2xl font-black uppercase tracking-tight text-[var(--liceu-accent)]"
          >
            Liceu Underground
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {([
              { href: "/metodo", label: "M\u00e9todo" },
              { href: "/programa", label: "Programa" },
              { href: "/mentoria", label: "Mentoria" },
            ] as const).map((item) => (
              <Magnetic key={item.href} strength={0.15}>
                <Link
                  href={item.href}
                  className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] transition-colors hover:text-[var(--liceu-accent)]"
                >
                  {item.label}
                </Link>
              </Magnetic>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {/* Hero Section — The Monolith */}
        <section className="relative flex min-h-[92vh] flex-col items-center justify-center bg-[var(--liceu-surface-container-low)] px-4 md:px-6 py-24 sm:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--liceu-bg)] via-transparent to-transparent" />

          <ParallaxLayer speed={-8} className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-[var(--liceu-primary)]/5 blur-3xl" />
            <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-[var(--liceu-secondary)]/5 blur-3xl" />
          </ParallaxLayer>

          <div className="relative z-10 flex max-w-3xl sm:max-w-4xl flex-col items-center text-center">
            <div
              className="mb-8 bg-[var(--liceu-primary-container)] px-4 py-1 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.3em] text-[var(--liceu-text)]"
              style={{ animation: "qa-rise 0.8s ease-out 0.1s both" }}
            >
              The Brutalist Archive
            </div>

            <TextReveal
              text="Voc\u00ea \u00e9 inteligente."
              as="h1"
              className="font-[var(--font-noto-serif)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black uppercase tracking-tighter leading-none"
              staggerDelay={0.04}
            />
            <TextReveal
              text="Sob press\u00e3o, n\u00e3o parece."
              as="h1"
              className="font-[var(--font-noto-serif)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black uppercase tracking-tighter leading-none text-[var(--liceu-accent)]"
              staggerDelay={0.04}
              delay={0.5}
            />

            <p
              className="mt-6 sm:mt-8 max-w-lg sm:max-w-xl text-base sm:text-lg leading-relaxed text-[var(--liceu-muted)]"
              style={{ animation: "qa-rise 0.8s ease-out 1s both", opacity: 0 }}
            >
              Uma escola de pensamento aplicado \u00e0 fala. Fundada na ret\u00f3rica cl\u00e1ssica.
              Constru\u00edda para quem colapsa onde mais importa.
            </p>

            <div
              className="mt-10 sm:mt-12 flex flex-col items-center gap-6"
              style={{ animation: "qa-rise 0.8s ease-out 1.3s both", opacity: 0 }}
            >
              <div className="h-1 w-16 bg-[var(--liceu-secondary)]" />
              <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                Access Required
              </div>
              <div className="flex gap-4">
                <Magnetic strength={0.2}>
                  <Link href="/diagnostico">
                    <MinimalButton variant="primary">Iniciar diagn\u00f3stico</MinimalButton>
                  </Link>
                </Magnetic>
                <Magnetic strength={0.2}>
                  <Link href="/manifesto">
                    <MinimalButton variant="quiet">Ler manifesto</MinimalButton>
                  </Link>
                </Magnetic>
              </div>
            </div>
          </div>
        </section>

        {/* Three Pillars */}
        <section className="py-20 sm:py-32">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-0 md:grid-cols-3">
            {[
              {
                title: "N\u00e3o \u00e9",
                items: ["Curso de orat\u00f3ria", "T\u00e9cnica de palco", "Dicas de postura", "Motiva\u00e7\u00e3o"],
              },
              {
                title: "\u00c9",
                items: [
                  "Treinamento de estrutura l\u00f3gica",
                  "Press\u00e3o progressiva controlada",
                  "Ret\u00f3rica cl\u00e1ssica aplicada",
                  "M\u00e9todo — n\u00e3o performance",
                ],
              },
              {
                title: "Para quem",
                items: [
                  "Colapsa sob interrup\u00e7\u00e3o",
                  "Sabe mais do que consegue defender",
                  "Perde terreno para quem blafa",
                  "Quer a estrutura, n\u00e3o o carisma",
                ],
              },
            ].map((col, idx) => (
              <div
                key={col.title}
                className={`group relative bg-[var(--liceu-surface-container)] p-8 sm:p-12 transition-all duration-300 hover:bg-[var(--liceu-surface-container-high)] ${
                  idx === 1 ? "md:-translate-y-8" : ""
                } border-l border-[var(--liceu-stone)]/15`}
              >
                <div className="absolute top-0 left-0 h-0 w-1 bg-[var(--liceu-accent)] transition-all duration-700 group-hover:h-full" />
                <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                  {col.title}
                </div>
                <ul className="mt-6 space-y-4">
                  {col.items.map((item) => (
                    <li
                      key={item}
                      className="font-[var(--font-noto-serif)] text-[13px] sm:text-[14px] leading-snug text-[var(--liceu-text)]"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Diagnostic CTA */}
        <section className="relative bg-[var(--liceu-surface-container-lowest)] py-20 sm:py-32">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 sm:gap-12 px-4 md:px-6 md:grid-cols-2">
            <div className="relative surface-scriptorium p-8 sm:p-12">
              <h2 className="font-[var(--font-noto-serif)] text-2xl sm:text-3xl font-bold uppercase">
                Diagn\u00f3stico t\u00e9cnico
              </h2>
              <p className="mt-4 text-[var(--liceu-muted)]">
                Avalia\u00e7\u00e3o precisa de onde e por que sua intelig\u00eancia falha sob cobran\u00e7a.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Identifica\u00e7\u00e3o de pontos de colapso",
                  "An\u00e1lise de estrutura argumentativa",
                  "Recomenda\u00e7\u00e3o de m\u00f3dulo de entrada",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 bg-[var(--liceu-accent)]" />
                    <span className="text-sm text-[var(--liceu-muted)]">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Magnetic strength={0.2}>
                  <Link href="/diagnostico">
                    <button className="bg-[var(--liceu-secondary-container)] px-6 sm:px-8 py-3 sm:py-4 font-[var(--font-space-grotesk)] text-xs font-black uppercase tracking-[0.3em] text-[var(--liceu-text)] transition-colors hover:bg-[var(--liceu-secondary)] hover:text-[var(--liceu-on-secondary-container)]">
                      Iniciar diagn\u00f3stico
                    </button>
                  </Link>
                </Magnetic>
              </div>
            </div>

            <div className="relative aspect-square border-l-4 border-[var(--liceu-accent)] bg-[var(--liceu-surface-container-high)]">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border border-[var(--liceu-accent)]/20 bg-[var(--liceu-bg)]/80 p-6 sm:p-8 text-center backdrop-blur-xl">
                  <p className="font-[var(--font-noto-serif)] text-xl sm:text-2xl italic text-[var(--liceu-text)]">
                    A intelig\u00eancia sem estrutura \u00e9 como uma espada sem cabo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products */}
        <section className="py-20 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="mb-12 font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Caminhos de entrada
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {([
                {
                  href: "/diagnostico",
                  tag: "GRATUITO",
                  title: "Diagn\u00f3stico t\u00e9cnico",
                  desc: "Avalia\u00e7\u00e3o t\u00e1tica do colapso. Por onde come\u00e7ar.",
                },
                {
                  href: "/programa",
                  tag: "R$ 149 — R$ 1.297",
                  title: "Programa",
                  desc: "Ebook ou aulas em v\u00eddeo. Progress\u00e3o estrita.",
                },
                {
                  href: "/mentoria",
                  tag: "R$ 4.999 — SELETIVO",
                  title: "Mentoria individual",
                  desc: "Corre\u00e7\u00e3o ao vivo. Seis sess\u00f5es.",
                },
              ] as const).map((p) => (
                <Magnetic key={p.href} strength={0.1}>
                  <Link
                    href={p.href}
                    className="group block border border-[var(--liceu-stone)] border-l-4 border-l-[var(--liceu-stone)] bg-[var(--liceu-surface-container)] p-6 sm:p-8 transition-all duration-300 hover:border-l-[var(--liceu-accent)] hover:bg-[var(--liceu-surface-container-high)] hover:translate-y-[-2px]"
                  >
                    <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                      {p.tag}
                    </div>
                    <div className="mt-4 font-[var(--font-noto-serif)] text-xl sm:text-2xl uppercase text-[var(--liceu-text)] group-hover:text-[var(--liceu-accent)] transition-colors duration-300">
                      {p.title}
                    </div>
                    <p className="mt-2 text-sm text-[var(--liceu-muted)]">{p.desc}</p>
                  </Link>
                </Magnetic>
              ))}
            </div>
          </div>
        </section>

        {/* Recent essays */}
        {POSTS.length > 0 && (
          <section className="border-t border-[var(--liceu-stone)] py-20 sm:py-32">
            <div className="mx-auto max-w-7xl px-4 md:px-6">
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
                    className="group block border border-[var(--liceu-stone)] bg-[var(--liceu-surface-container-high)] p-6 sm:p-8 transition-all duration-300 hover:bg-[var(--liceu-surface-container)] hover:translate-y-[-2px]"
                  >
                    <div className="font-[var(--font-noto-serif)] text-lg sm:text-xl uppercase text-[var(--liceu-text)] group-hover:text-[var(--liceu-accent)] transition-colors duration-300">
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
