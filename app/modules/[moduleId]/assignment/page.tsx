"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";
import { WritingArea } from "@/components/WritingArea";

export default function AssignmentPage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params?.moduleId ?? "";

  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if already submitted
    async function check() {
      try {
        const res = await fetch(`/api/modules/${moduleId}/speech`); // reuses speech GET pattern
        // Assignment doesn't have a GET yet — skip silently
      } catch { /* ignore */ }
    }
    check();
  }, [moduleId]);

  const wordCount = useMemo(
    () => text.trim().split(/\s+/).filter(Boolean).length,
    [text],
  );

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/modules/${moduleId}/speech`, {
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

  return (
    <ReadingLayout
      eyebrow="LICEU UNDERGROUND / PRODUÇÃO"
      title="Micro discurso escrito."
      subtitle="Estrutura deliberada. Tese, desenvolvimento, conclusão. Sem prolixidade."
    >
      <div className="space-y-6">
        <section className="space-y-3">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Instrução
          </div>
          <p className="font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
            Redija um micro discurso (150–400 palavras) aplicando o dispositivo
            central deste módulo. Uma tese clara, desenvolvimento preciso,
            conclusão sem evasão.
          </p>
        </section>

        {submitted ? (
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 px-5 py-5">
            <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-accent)]">
              Enviado
            </div>
            <p className="mt-2 font-[var(--font-liceu-sans)] text-[13px] text-[var(--liceu-muted)]">
              Seu texto foi recebido e está aguardando revisão.
            </p>
          </div>
        ) : (
          <>
            <WritingArea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Comece com a tese. Sem rodeios."
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
                  <MinimalButton
                    variant="quiet"
                    type="button"
                    onClick={() => setText("")}
                    disabled={!text || submitting}
                  >
                    Limpar
                  </MinimalButton>
                  <MinimalButton
                    type="button"
                    onClick={submit}
                    disabled={wordCount < 30 || submitting}
                  >
                    {submitting ? "Enviando..." : "Enviar"}
                  </MinimalButton>
                </div>
              </div>
            </section>
          </>
        )}

        <p className="font-[var(--font-liceu-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
          Não obrigatório para avançar. Revisão humana.
        </p>
      </div>
    </ReadingLayout>
  );
}
