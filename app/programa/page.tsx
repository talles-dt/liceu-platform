import { ReadingLayout } from "@/components/ReadingLayout";
import Link from "next/link";

const MODULES = [
  {
    index: 1,
    title: "Estrutura Mental",
    canon: "Inventio — Aristóteles",
    desc: "A fundação. Você aprende a ordenar atenção, intenção e direção antes de abrir a boca. Sem essa camada, tudo o que vem depois é improvisação disfarçada.",
    outcome: "Você para de pensar enquanto fala. Começa a falar o que já pensou.",
  },
  {
    index: 2,
    title: "Invenção",
    canon: "Inventio — Cícero",
    desc: "Descobrir os argumentos certos para o caso certo. Enquadrar a questão real em vez da questão apresentada. A diferença entre defender uma posição e ganhar um debate.",
    outcome: "Você identifica o ponto que decide o confronto antes de entrar nele.",
  },
  {
    index: 3,
    title: "Arranjo",
    canon: "Dispositio — Quintiliano",
    desc: "Transformar material disperso em sequência inevitável. Transições como força, não como cola. Refutação como parte da estrutura, não como reação.",
    outcome: "Sua fala tem direção interna. O ouvinte não precisa seguir — é conduzido.",
  },
  {
    index: 4,
    title: "Estilo",
    canon: "Elocutio — Cícero",
    desc: "Precisão lexical, densidade e ritmo. Estilo não é ornamento — é compressão. Uma frase densa carrega mais autoridade do que um parágrafo frouxo.",
    outcome: "Você diz mais com menos. Cada palavra sustenta peso.",
  },
  {
    index: 5,
    title: "Memória",
    canon: "Memoria — Quintiliano",
    desc: "Sustentar continuidade sob pressão. Pontos de apoio, mapas mentais e repetição dirigida. A memória treinada é o que impede o branco durante a cobrança.",
    outcome: "Interrupções não te fazem perder o fio. Você retorna ao ponto com precisão.",
  },
  {
    index: 6,
    title: "Entrega",
    canon: "Actio — Aristóteles",
    desc: "Execução vocal, corporal e temporal a serviço do argumento. Silêncio calculado. Presença sem gesticulação ansiosa. O ambiente se organiza ao redor de quem sabe esperar.",
    outcome: "Você não força autoridade. Ela emerge da estrutura que você construiu.",
  },
] as const;

export default function ProgramaPage() {
  return (
    <ReadingLayout
      eyebrow="LICEU / PROGRAMA"
      title="Seis módulos. Um cânone. Sem atalhos."
      subtitle="O programa é a síntese operacional da retórica clássica. Aristóteles, Cícero e Quintiliano — não como história, mas como tecnologia para quem precisa operar sob pressão."
    >
      <div className="space-y-14">

        {/* Opening */}
        <section className="space-y-4 font-[var(--font-noto-serif)] text-[15px] leading-[1.95] text-[var(--liceu-text)]">
          <p>
            A retórica clássica não foi construída para palestrantes motivacionais.
            Foi construída por homens que perdiam processos, carreiras e às vezes
            a vida quando o argumento colapsava. Ela existe para operar sob adversidade —
            não para performar em condições favoráveis.
          </p>
          <p>
            O programa segue o cânone em ordem porque a ordem não é arbitrária.
            Cada módulo pressupõe o anterior. Pular é o equivalente a tentar
            levantar peso máximo sem ter construído a fundação.
          </p>
        </section>

        {/* Module list */}
        <section className="space-y-4">
          <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Os módulos
          </div>
          <ol className="space-y-px">
            {MODULES.map((m) => (
              <li
                key={m.title}
                className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/25 px-5 py-6 space-y-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="font-[var(--font-noto-serif)] text-[20px] text-[var(--liceu-text)]">
                    {m.index}. {m.title}
                  </div>
                  <div className="font-[var(--font-space-grotesk)] text-[10px] tracking-[0.2em] text-[var(--liceu-muted)]">
                    {m.canon}
                  </div>
                </div>
                <p className="font-[var(--font-noto-serif)] text-[14px] leading-[1.9] text-[var(--liceu-muted)]">
                  {m.desc}
                </p>
                <div className="border-l-2 border-[var(--liceu-secondary)]/40 pl-3 font-[var(--font-work-sans)] text-[12px] text-[var(--liceu-text)]">
                  {m.outcome}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* What's inside */}
        <section className="space-y-5 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Dentro de cada módulo
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              { item: "Leitura dirigida", note: "Textos selecionados do cânone com objetivo explícito." },
              { item: "Aula estruturada", note: "Conceito, mapa e exemplos precisos. Sem espetáculo." },
              { item: "Quiz de verificação", note: "Impede ilusão de entendimento. Mínimo de 70% para avançar." },
              { item: "Exercício retórico", note: "Produção escrita com tese, razões e refutação. Revisão humana." },
              { item: "Análise de texto clássico", note: "Identificação e explicação de dispositivos retóricos." },
              { item: "Micro discurso", note: "Aplicação do dispositivo central do módulo em forma concisa." },
              { item: "Flashcards SM-2", note: "Repetição espaçada baseada no algoritmo SuperMemo." },
              { item: "Sessão de mentoria", note: "Liberada após conclusão do módulo. Correção técnica ao vivo." },
            ].map((f) => (
              <div
                key={f.item}
                className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/25 px-4 py-4"
              >
                <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.18em] text-[var(--liceu-text)]">
                  {f.item}
                </div>
                <p className="mt-1 font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-muted)]">
                  {f.note}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* The rule */}
        <section className="border border-[var(--liceu-secondary)]/20 bg-[var(--liceu-surface)]/25 px-6 py-6 space-y-3">
          <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-secondary)]/70">
            A regra de progressão
          </div>
          <p className="font-[var(--font-noto-serif)] text-[15px] leading-[1.95] text-[var(--liceu-text)]">
            Nenhum módulo é desbloqueado antes do anterior estar completo.
            Completo significa: todas as lições, quiz com nota mínima de 70%,
            e exercício retórico aprovado. Não existe exceção.
          </p>
          <p className="font-[var(--font-noto-serif)] text-[14px] leading-[1.9] text-[var(--liceu-muted)]">
            Essa rigidez não é burocracia. É a tecnologia do processo.
            A fundação precisa estar sólida antes de puxar o peso.
          </p>
        </section>

        {/* Acesso */}
        <section className="space-y-6 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Acesso — diagnóstico primeiro
          </div>

          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface-container)] px-6 py-6 space-y-4">
            <div>
              <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                Primeiro passo
              </div>
              <div className="mt-2 font-[var(--font-noto-serif)] text-[22px] text-[var(--liceu-text)]">
                Faça o diagnóstico
              </div>
            </div>
            <p className="font-[var(--font-noto-serif)] text-[15px] leading-[1.85] text-[var(--liceu-muted)]">
              Todo acesso ao programa começa pelo diagnóstico técnico. Ele identifica
              onde sua inteligência falha sob pressão e recomenda o ponto de entrada
              certo. Sem diagnóstico, não há matrícula.
            </p>
            <Link href="/diagnostico">
              <button className="bg-[var(--liceu-primary)] px-8 py-4 font-[var(--font-space-grotesk)] text-xs font-black uppercase tracking-[0.15em] text-[var(--liceu-text)] transition-colors hover:opacity-90">
                Iniciar diagnóstico gratuito
              </button>
            </Link>
          </div>

          <div className="space-y-2 font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-muted)]">
            <p>
              Após o diagnóstico, você receberá uma recomendação clara: ebook (R$ 149),
              vídeo-aulas (R$ 1.297), ou mentoria individual (R$ 4.999, seletivo).
            </p>
            <p>
              Quer entender como funciona a mentoria?{" "}
              <Link href="/mentoria" className="underline underline-offset-4 hover:text-[var(--liceu-text)]">
                Ver formato de mentoria →
              </Link>
            </p>
          </div>
        </section>

      </div>
    </ReadingLayout>
  );
}
