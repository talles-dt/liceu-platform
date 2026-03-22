"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";
import { WritingArea } from "@/components/WritingArea";

const DEFAULT_PROMPT =
  "Redija um texto argumentativo (400–800 palavras) defendendo uma tese clara, com pelo menos duas razões e um contra-argumento respondido. Aplique o dispositivo central deste módulo.";

export default function AssignmentPage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params?.moduleId ?? "";

  const [prompt, setPrompt] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/modules/${moduleId}/assignment`);
        if (res.ok) {
          const data = await res.json() as {
            prompt: string | null;
            submission: { status: string; content: string } | null;
          };
          setPrompt(data.prompt);
          if (data.submission) {
            setExistingStatus(data.submission.status);
            setText(data.submission.content ?? "");
          }
        }
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, [moduleId]);

  const wordCount = useMemo(
    () => text.trim().split(/\s+/).filter(Boolean).length,
    [text],
  );

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/modules/${moduleId}/assignment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setError(d.error ?? "Erro ao enviar.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Erro de rede.");
    } finally {
      setSubmitting(false);
    }
  }

  const alreadySubmitted = submitted || !!existingStatus;

  if (loading) {
    return (
      <ReadingLayout eyebrow="LICEU UNDERGROUND / PRODUÇÃO" title="Exercício retórico." subtitle="">
        <p className="font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-muted)]">Carregando...</p>
      </ReadingLayout>
    );
  }

  return (
    <ReadingLayout
      eyebrow="LICEU UNDERGROUND / PRODUÇÃO"
      title="Exercício retórico principal."
      subtitle="Estrutura lógica, clareza, evidência, estilo. Escreva como quem treina."
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Instrução
          </div>
          <p className="font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
            {prompt ?? DEFAULT_PROMPT}
          </p>
        </section>

        {alreadySubmitted ? (
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 px-5 py-5 space-y-3">
            <div className={[
              "font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em]",
              existingStatus === "approved"
                ? "text-[var(--liceu-accent)]"
                : "text-[var(--liceu-muted)]",
            ].join(" ")}>
              {existingStatus === "approved" ? "Aprovado" : "Aguardando revisão"}
            </div>
            <p className="font-[var(--font-liceu-sans)] text-[13px] text-[var(--liceu-muted)]">
              {existingStatus === "approved"
                ? "Seu exercício foi aprovado. Módulo desbloqueado."
                : "Seu texto foi recebido. A revisão é humana — aguarde."}
            </p>
            <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] px-4 py-4">
              <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)] mb-2">
                Sua submissão
              </div>
              <p className="font-serif text-[13px] leading-[1.85] text-[var(--liceu-muted)] whitespace-pre-wrap">
                {text}
              </p>
            </div>
          </div>
        ) : (
          <>
            <WritingArea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Comece pela tese. Frases completas. Rigor. Sem pressa."
            />
            <section className="flex items-center justify-between border-t border-[var(--liceu-stone)]/70 pt-6">
              <div className="font-[var(--font-liceu-mono)] text-[11px] tracking-[0.22em] text-[var(--liceu-muted)]">
                {wordCount} palavras
              </div>
              <div className="flex flex-col items-end gap-2">
                {error && (
                  <p className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
                    {error}
                  </p>
                )}
                <div className="flex gap-3">
                  <MinimalButton variant="quiet" type="button" onClick={() => setText("")} disabled={!text || submitting}>
                    Limpar
                  </MinimalButton>
                  <MinimalButton type="button" onClick={submit} disabled={wordCount < 50 || submitting}>
                    {submitting ? "Enviando..." : "Enviar"}
                  </MinimalButton>
                </div>
              </div>
            </section>
          </>
        )}

        <p className="font-[var(--font-liceu-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
          Este exercício é revisado pelo instrutor. A aprovação desbloqueia o próximo módulo.
        </p>
      </div>
    </ReadingLayout>
  );
}
