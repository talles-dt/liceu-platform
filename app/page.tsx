import Link from "next/link";
import { ReadingLayout } from "@/components/ReadingLayout";
import { POSTS } from "@/lib/blog";

export default function HomePage() {
  const doors = [
    {
      href: "/manifesto" as const,
      title: "Manifesto",
      note: "A chamada completa. A tese. O rigor.",
    },
    {
      href: "/diagnostico" as const,
      title: "Diagnóstico técnico",
      note: "A porta de entrada. Avaliação tática.",
    },
    { href: "/metodo" as const, title: "Método", note: "Como o sistema opera." },
    {
      href: "/programa" as const,
      title: "Programa",
      note: "Seis módulos, em ordem.",
    },
    {
      href: "/mentoria" as const,
      title: "Mentoria",
      note: "Correção 1:1. Vagas limitadas.",
    },
    { href: "/blog" as const, title: "Blog", note: "Ensaios em forma de método." },
    { href: "/login" as const, title: "Login", note: "Acesso do aluno." },
  ];

  return (
    <ReadingLayout
      eyebrow="LICEU UNDERGROUND"
      title="Instituição. Método. Exigência."
      subtitle="Escola de pensamento aplicado à fala."
    >
      <div className="space-y-12">
        <section className="space-y-4 font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
          <p>
            O Liceu Underground é uma escola de pensamento aplicado à fala. Não
            é entretenimento. Não é palco. É disciplina intelectual.
          </p>
        </section>

        <section className="space-y-5 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Portas
          </div>
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35">
            <ul className="divide-y divide-[var(--liceu-stone)]/70">
              {doors.map((item) => (
                <li key={item.href} className="px-5 py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <Link
                      href={item.href}
                      className="font-serif text-[18px] text-[var(--liceu-text)] underline decoration-[var(--liceu-stone)] underline-offset-4 hover:decoration-[var(--liceu-accent)]"
                    >
                      {item.title}
                    </Link>
                    <div className="font-[var(--font-liceu-mono)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
                      ABRIR
                    </div>
                  </div>
                  <div className="mt-2 font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
                    {item.note}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-5 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="flex items-baseline justify-between gap-6">
            <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Ensaios recentes
            </div>
            <Link
              href="/blog"
              className="font-[var(--font-liceu-mono)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)] underline underline-offset-4 hover:text-[var(--liceu-text)]"
            >
              VER TODOS
            </Link>
          </div>
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35">
            <ul className="divide-y divide-[var(--liceu-stone)]/70">
              {POSTS.slice(0, 2).map((post) => (
                <li key={post.slug} className="px-5 py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <Link
                      href={`/blog/${post.slug}` as never}
                      className="font-serif text-[18px] text-[var(--liceu-text)] underline decoration-[var(--liceu-stone)] underline-offset-4 hover:decoration-[var(--liceu-accent)]"
                    >
                      {post.title}
                    </Link>
                    <div className="font-[var(--font-liceu-mono)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
                      {post.date}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </ReadingLayout>
  );
}

