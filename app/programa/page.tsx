import { ReadingLayout } from "@/components/ReadingLayout";
import { PurchaseButton } from "@/components/PurchaseButton";

const MODULES = [
  {
    title: "Estrutura Mental",
    desc: "Fundação: ordenar atenção, intenção e direção. Construir a ossatura antes do conflito.",
    skill: "Diagnóstico e arquitetura inicial do raciocínio.",
  },
  {
    title: "Invenção",
    desc: "Descobrir argumentos relevantes. Enquadrar a questão real e escolher o que decide o caso.",
    skill: "Heurística argumentativa (inventio).",
  },
  {
    title: "Arranjo",
    desc: "Transformar material em sequência inevitável. Transições, blocos e refutação.",
    skill: "Arquitetura do discurso (dispositio).",
  },
  {
    title: "Estilo",
    desc: "Precisão lexical, ritmo e força. Estilo como ferramenta de clareza, não adorno.",
    skill: "Elocução disciplinada (elocutio).",
  },
  {
    title: "Memória",
    desc: "Sustentar continuidade sob pressão. Pontos de apoio, mapas e repetição dirigida.",
    skill: "Retenção estrutural e execução sem colapso.",
  },
  {
    title: "Entrega",
    desc: "Execução vocal e corporal a serviço do sentido. Silêncio, presença e direção.",
    skill: "Actio: domínio do ambiente sem histeria.",
  },
] as const;

export default function ProgramaPage() {
  return (
    <ReadingLayout
      eyebrow="LICEU / PROGRAMA"
      title="Os seis módulos"
      subtitle="Uma progressão. Uma disciplina. Sem atalhos."
    >
      <div className="space-y-10">
        <section className="space-y-4 font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
          <p>
            O programa é deliberadamente simples: seis módulos, em ordem. Cada
            unidade acrescenta uma peça ao mecanismo.
          </p>
        </section>

        <section className="space-y-4">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Lista vertical
          </div>
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35">
            <ol className="divide-y divide-[var(--liceu-stone)]/70">
              {MODULES.map((m, idx) => (
                <li key={m.title} className="px-5 py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-4">
                    <div className="font-serif text-[20px] text-[var(--liceu-text)]">
                      {idx + 1}. {m.title}
                    </div>
                    <div className="font-[var(--font-liceu-mono)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
                      HABILIDADE
                    </div>
                  </div>
                  <p className="mt-3 font-serif text-[15px] leading-[1.9] text-[var(--liceu-muted)]">
                    {m.desc}
                  </p>
                  <div className="mt-3 font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-text)]">
                    {m.skill}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="space-y-4 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Aquisição (pagamento único)
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 px-5 py-5">
              <div className="font-serif text-[18px] text-[var(--liceu-text)]">
                Ebook
              </div>
              <div className="mt-2 font-[var(--font-liceu-sans)] text-[13px] text-[var(--liceu-muted)]">
                R$ 149
              </div>
              <div className="mt-4">
                <PurchaseButton kind="ebook">Comprar ebook</PurchaseButton>
              </div>
            </div>

            <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 px-5 py-5">
              <div className="font-serif text-[18px] text-[var(--liceu-text)]">
                Aulas em vídeo
              </div>
              <div className="mt-2 font-[var(--font-liceu-sans)] text-[13px] text-[var(--liceu-muted)]">
                R$ 1.297
              </div>
              <div className="mt-4">
                <PurchaseButton kind="video">Comprar acesso</PurchaseButton>
              </div>
            </div>
          </div>

          <div className="font-[var(--font-liceu-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
            Acesso ao curso é provisionado após a confirmação do pagamento.
          </div>
        </section>
      </div>
    </ReadingLayout>
  );
}

