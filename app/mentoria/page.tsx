import Link from "next/link";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";

export default function MentoriaPage() {
  return (
    <ReadingLayout
      eyebrow="LICEU / MENTORIA"
      title="Correção ao vivo. Não há substituto."
      subtitle="Seis sessões individuais. Entrada por seleção. A mentoria começa onde o programa sozinho termina."
    >
      <div className="space-y-14">

        {/* Opening */}
        <section className="space-y-4 font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
          <p>
            O programa constrói a fundação. A mentoria aplica pressão sobre ela.
          </p>
          <p>
            Existe uma diferença fundamental entre entender a estrutura retórica
            e conseguir sustentá-la quando alguém te interrompe, discorda com
            hostilidade ou exige uma resposta em cinco segundos. Essa diferença
            não se fecha lendo. Fecha com repetição sob carga — e com alguém
            que sabe exatamente onde a estrutura cedeu e por quê.
          </p>
        </section>

        {/* Format */}
        <section className="space-y-5 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            O formato
          </div>
          <div className="space-y-3">
            {[
              {
                title: "Seis sessões individuais",
                body: "Cada sessão é de 60 minutos, 1:1. Não há grupo, não há turma. A correção é sobre o seu padrão específico de colapso, não sobre um caso genérico.",
              },
              {
                title: "Progressão vinculada ao programa",
                body: "As sessões são liberadas conforme você conclui os módulos correspondentes. Você não entra em simulação de conflito sem ter construído a fundação. A sequência não é negociável.",
              },
              {
                title: "Agendamento via Cal.com",
                body: "Você agenda no seu tempo, dentro das janelas disponíveis. Sem intermediários, sem espera por confirmação manual.",
              },
              {
                title: "Correção técnica, não coaching",
                body: "As sessões são análise de estrutura. Onde o argumento cedeu. Qual palavra criou ambiguidade. Onde o silêncio deveria ter cortado. Não há conversa sobre motivação.",
              },
            ].map((f) => (
              <div key={f.title} className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/25 px-5 py-5 space-y-2">
                <div className="font-serif text-[16px] text-[var(--liceu-text)]">{f.title}</div>
                <p className="font-serif text-[14px] leading-[1.9] text-[var(--liceu-muted)]">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Selection */}
        <section className="space-y-5 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            O processo de seleção
          </div>
          <div className="space-y-4 font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
            <p>
              A mentoria não é de livre acesso porque o formato não funciona
              para todo mundo. Funciona para quem tem a capacidade de
              aplicar feedback técnico imediatamente — e a disposição de
              ser corrigido com precisão, sem suavização.
            </p>
            <p>
              A seleção existe para proteger o processo, não para criar
              exclusividade artificial.
            </p>
          </div>
          <ol className="space-y-3">
            {[
              {
                step: "01",
                title: "Diagnóstico técnico",
                body: "O ponto de partida obrigatório. Avaliação gratuita do seu padrão de colapso.",
              },
              {
                step: "02",
                title: "Taxa de entrevista — R$ 99",
                body: "Confirma comprometimento e cobre o tempo da avaliação. Creditada integralmente no programa caso você seja aprovado.",
              },
              {
                step: "03",
                title: "Entrevista de qualificação",
                body: "Uma conversa de 30 minutos. Avaliamos se o formato é compatível com o seu momento e suas metas. Sem promessas, sem venda.",
              },
              {
                step: "04",
                title: "Aprovação e acesso",
                body: "Se houver encaixe, você recebe um link de pagamento com o crédito dos R$ 99 aplicado. Você paga R$ 4.900 pelo programa completo.",
              },
            ].map((s) => (
              <li key={s.step} className="flex gap-5 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/25 px-5 py-5">
                <div className="shrink-0 font-[var(--font-liceu-mono)] text-[22px] text-[var(--liceu-stone)]">
                  {s.step}
                </div>
                <div className="space-y-1">
                  <div className="font-serif text-[16px] text-[var(--liceu-text)]">{s.title}</div>
                  <p className="font-serif text-[13px] leading-[1.85] text-[var(--liceu-muted)]">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Pricing clarity */}
        <section className="border border-[var(--liceu-accent)]/20 bg-[var(--liceu-surface)]/25 px-6 py-6 space-y-4">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-accent)]/70">
            Estrutura de preço
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 font-serif text-[14px] text-[var(--liceu-text)]">
            <div className="space-y-1">
              <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">Entrevista</div>
              <div className="text-[18px]">R$ 99</div>
              <div className="text-[12px] text-[var(--liceu-muted)]">Creditado na aprovação</div>
            </div>
            <div className="space-y-1">
              <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">Programa completo</div>
              <div className="text-[18px]">R$ 4.999</div>
              <div className="text-[12px] text-[var(--liceu-muted)]">Seis sessões + plataforma</div>
            </div>
            <div className="space-y-1">
              <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">Se aprovado, você paga</div>
              <div className="text-[18px]">R$ 4.900</div>
              <div className="text-[12px] text-[var(--liceu-muted)]">R$ 99 deduzidos</div>
            </div>
          </div>
          <p className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
            A taxa de entrevista não é reembolsável em caso de rejeição. Candidatos rejeitados
            mantêm acesso ao diagnóstico e ao programa de vídeo se já adquirido.
          </p>
        </section>

        {/* CTA */}
        <section className="space-y-4 border-t border-[var(--liceu-stone)]/70 pt-10">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Primeiro passo
          </div>
          <p className="font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
            O processo começa pelo diagnóstico técnico gratuito. Sem o diagnóstico,
            não há entrevista.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/diagnostico">
              <MinimalButton>Fazer o diagnóstico</MinimalButton>
            </Link>
            <Link href="/programa">
              <MinimalButton variant="quiet">Ver o programa</MinimalButton>
            </Link>
          </div>
        </section>

      </div>
    </ReadingLayout>
  );
}
