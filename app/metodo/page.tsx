import { ReadingLayout } from "@/components/ReadingLayout";

const STEPS = [
  {
    title: "Leitura",
    body: "Texto como matéria-prima. Leitura dirigida com objetivo: identificar tese, premissas, transições, objeções e conclusão.",
  },
  {
    title: "Aula",
    body: "Exposição controlada. Pouco espetáculo, muita estrutura: conceitos, exemplos precisos e mapas mentais operacionais.",
  },
  {
    title: "Quiz",
    body: "Verificação. Perguntas conceituais para impedir ilusão de entendimento e obrigar discriminação lógica.",
  },
  {
    title: "Escrita",
    body: "Produção. Texto curto, tese explícita, razões independentes, objeção forte e resposta. Clareza como disciplina.",
  },
  {
    title: "Mentoria",
    body: "Correção e direção. Feedback técnico, sem floreio: estrutura, cortes, reescrita e postura intelectual sob pressão.",
  },
] as const;

export default function MetodoPage() {
  return (
    <ReadingLayout
      eyebrow="LICEU / MÉTODO"
      title="Como o sistema funciona"
      subtitle="Estrutura, verificação e produção. Em ordem."
    >
      <div className="space-y-12">
        <section className="space-y-4 font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
          <p>
            O Liceu é um sistema de treino intelectual. Não depende de carisma.
            Depende de método. Você não “assiste” — você executa.
          </p>
        </section>

        <section className="space-y-5">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Estrutura (sempre igual)
          </div>
          <ol className="space-y-4">
            {STEPS.map((s) => (
              <li
                key={s.title}
                className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 px-5 py-5"
              >
                <div className="font-serif text-[18px] text-[var(--liceu-text)]">
                  {s.title}
                </div>
                <p className="mt-3 font-serif text-[14px] leading-[1.9] text-[var(--liceu-muted)]">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </section>

        <section className="space-y-4 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Progressão
          </div>
          <div className="space-y-4 font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
            <p>
              A progressão é estrita. <strong>Sem pular módulos.</strong> A
              disciplina não é “estética” — é a própria tecnologia do processo.
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                Um módulo só é concluído quando você cumpre os critérios de
                verificação e produção.
              </li>
              <li>
                A mentoria é liberada apenas após a conclusão do módulo, para
                evitar conversa vazia.
              </li>
              <li>
                Quem não sustenta constância não avança — por design.
              </li>
            </ul>
          </div>
        </section>
      </div>
    </ReadingLayout>
  );
}

