"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

type Result = "rejeicao" | "apostila" | "video" | "entrevista";

interface ResultConfig {
  label: string;
  title: string;
  body: string[];
  ctaLabel?: string;
  ctaKind?: string;
  accentColor: string;
}

const RESULT_MAP: Record<Result, ResultConfig> = {
  rejeicao: {
    label: "REJEIÇÃO",
    title: "Seu perfil não se encaixa no Liceu.",
    body: [
      "Isso não é um insulto. É um filtro.",
      "O Liceu não é para quem busca motivação, gatilhos mentais ou um palco para carisma. É para quem reconhece que sua inteligência falha sob pressão estrutural — e quer corrigir a falha na raiz.",
      "Se você chegou até aqui e ainda não viu o valor da disciplina retórica, talvez o Instagram seja um caminho mais leve.",
    ],
    accentColor: "var(--liceu-muted)",
  },
  apostila: {
    label: "RECOMENDAÇÃO: EBOOK",
    title: "Sua estrutura tem fissuras. O ebook é o ponto de entrada.",
    body: [
      "Você reconhece que o problema não é timidez ou falta de voz — é uma falha de esqueleto lógico. Mas ainda não está pronto para a pressão ao vivo.",
      "O ebook é o programa completo em forma escrita. Seis módulos, exercícios, flashcards SM-2 e progressão guiada. Você lê, pratica e constrói a fundação no seu ritmo.",
      "Se após o ebook você sentir que precisa de mais, o upgrade para vídeo-aulas ou mentoria está aberto.",
    ],
    ctaLabel: "Comprar ebook — R$ 149",
    ctaKind: "ebook",
    accentColor: "var(--liceu-accent)",
  },
  video: {
    label: "RECOMENDAÇÃO: VÍDEO-AULAS",
    title: "Você entende o problema. Agora veja a estrutura operar.",
    body: [
      "Você já tem clareza de que seu defeito não é na voz ou na timidez — é numa falha estrutural de pensamento sob pressão.",
      "As vídeo-aulas mostram os dispositivos retóricos em ação. A diferença entre ler sobre pressão e ver a estrutura operar sob ela é brutal.",
      "Ebook + aulas gravadas com demonstração prática. Progressão estrita. Sem atalhos.",
    ],
    ctaLabel: "Comprar vídeo-aulas — R$ 1.297",
    ctaKind: "video",
    accentColor: "var(--liceu-accent)",
  },
  entrevista: {
    label: "RECOMENDAÇÃO: MENTORIA",
    title: "Você é o tipo de aluno que o Liceu existe para treinar.",
    body: [
      "Você não engole o 'não' em seco. Questiona sob premissas. Exige argumentação sustentada. Isso é exatamente o perfil que a mentoria individual foi construída para forjar.",
      "O processo começa com uma entrevista de qualificação de 30 minutos (taxa de R$ 99). Se houver encaixe, você recebe um link de pagamento com o crédito aplicado e paga R$ 4.900 pelo programa completo.",
      "Seis sessões ao vivo. Correção técnica implacável. Sem aplausos.",
    ],
    ctaLabel: "Agendar entrevista — R$ 99",
    ctaKind: "mentoring_interview",
    accentColor: "var(--liceu-secondary)",
  },
};

export default function DiagnosticoResultadoClient() {
  const searchParams = useSearchParams();
  const result = (searchParams.get("r") as Result) ?? null;
  const email = searchParams.get("e") ?? "";
  const name = searchParams.get("n") ?? "";
  const score = searchParams.get("s") ?? "";
  const [loading, setLoading] = useState(false);
  const [webhookSent, setWebhookSent] = useState(false);

  // Fire the webhook email in the background when page loads
  useEffect(() => {
    if (!result || !email || !name) return;
    fetch("/api/email/diagnostico", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nome: name, resultado: result }),
    })
      .then(() => setWebhookSent(true))
      .catch(() => {});
  }, [result, email, name]);

  if (!result || !RESULT_MAP[result]) {
    return (
      <div className="min-h-screen bg-[var(--liceu-bg)] text-[var(--liceu-text)] flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Resultado inválido
          </div>
          <p className="mt-4 font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)]">
            Não foi possível carregar seu resultado.{" "}
            <Link href="/diagnostico" className="text-[var(--liceu-accent)] underline underline-offset-4">
              Refaça o diagnóstico
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const config = RESULT_MAP[result];

  async function handleCheckout() {
    if (!config.ctaKind) return;
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: config.ctaKind }),
      });
      const data = await res.json();
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok || !data.url) {
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--liceu-bg)] text-[var(--liceu-text)]">
      {/* Top Bar */}
      <header className="border-b border-[var(--liceu-stone)] border-l-4 border-l-[var(--liceu-accent)] bg-[var(--liceu-surface)]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className="font-[var(--font-noto-serif)] text-xl font-black uppercase tracking-tight text-[var(--liceu-accent)]"
          >
            Liceu Underground
          </Link>
          <Link
            href="/diagnostico"
            className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] hover:text-[var(--liceu-accent)] transition-colors"
          >
            Refazer diagnóstico
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        {/* Result Header */}
        <div className="mb-12">
          <div
            className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.3em]"
            style={{ color: config.accentColor }}
          >
            {config.label}
          </div>
          <h1 className="mt-4 font-[var(--font-noto-serif)] text-3xl md:text-5xl font-black uppercase leading-tight tracking-tight">
            {config.title}
          </h1>
          {score && (
            <div className="mt-4 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Pontuação: {score}/20
            </div>
          )}
          {webhookSent && (
            <div className="mt-2 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-accent)]">
              ✓ Resultado também enviado por email
            </div>
          )}
        </div>

        {/* Body */}
        <div className="space-y-6 font-[var(--font-work-sans)] text-[15px] leading-relaxed text-[var(--liceu-muted)]">
          {config.body.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {/* CTA */}
        {config.ctaLabel && (
          <div className="mt-12 border-t border-[var(--liceu-stone)] pt-10">
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="bg-[var(--liceu-primary)] px-10 py-5 font-[var(--font-space-grotesk)] text-xs font-black uppercase tracking-[0.2em] text-[var(--liceu-text)] transition-all hover:bg-[var(--liceu-accent)] hover:text-[var(--liceu-on-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Redirecionando..." : config.ctaLabel}
            </button>
            <p className="mt-4 font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-muted)]">
              Pagamento único. Acesso imediato após confirmação.
            </p>
          </div>
        )}

        {/* Rejection: Instagram link */}
        {result === "rejeicao" && (
          <div className="mt-12 border-t border-[var(--liceu-stone)] pt-10">
            <p className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)]">
              Enquanto isso, acompanhe o Liceu no{" "}
              <a
                href="https://instagram.com/liceuunderground"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--liceu-accent)] underline underline-offset-4 hover:text-[var(--liceu-text)]"
              >
                Instagram
              </a>
              . Talvez um dia nossos caminhos se cruzem.
            </p>
          </div>
        )}

        {/* Footer links */}
        <div className="mt-20 border-t border-[var(--liceu-stone)]/50 pt-8 flex flex-wrap gap-6 font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">
          <Link href="/manifesto" className="hover:text-[var(--liceu-text)] transition-colors">
            Manifesto
          </Link>
          <Link href="/metodo" className="hover:text-[var(--liceu-text)] transition-colors">
            Método
          </Link>
          <Link href="/programa" className="hover:text-[var(--liceu-text)] transition-colors">
            Programa
          </Link>
          <Link href="/blog" className="hover:text-[var(--liceu-text)] transition-colors">
            Blog
          </Link>
        </div>
      </main>
    </div>
  );
}
