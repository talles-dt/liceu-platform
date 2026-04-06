"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";
import { WritingArea } from "@/components/WritingArea";

export default function AssignmentPage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params?.moduleId ?? "";

  const [prompt, setPrompt] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load prompt and check existing submission
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/modules/${moduleId}/assignment`);
        if (res.ok) {
          const data = await res.json();
          setPrompt(data.prompt);
          if (data.submission) {
            setExistingStatus(data.submission.status);
            if (data.submission.status !== "rejected") {
              setSubmitted(true);
            }
          }
        }
      } catch { /* ignore */ }
    }
    load();
  }, [moduleId]);

  const wordCount = useMemo(
    () => text.trim().split(/\s+/).filter(Boolean).length,
    [text],
  );

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      // 10MB limit, PDF/DOC/TXT only
      if (f.size > 10 * 1024 * 1024) {
        setError("Arquivo muito grande. Máximo: 10MB.");
        return;
      }
      const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
      if (!allowed.includes(f.type) && !f.name.endsWith(".txt")) {
        setError("Formato não aceito. Use PDF, DOC, DOCX ou TXT.");
        return;
      }
      setFile(f);
      setError("");
    }
  }, []);

  async function submit() {
    setError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("content", text);
      formData.append("moduleId", moduleId);
      if (file) formData.append("file", file);

      const res = await fetch(`/api/modules/${moduleId}/assignment`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setError(d.error ?? "Erro ao enviar.");
        return;
      }
      const data = await res.json();
      setSubmitted(true);
      setExistingStatus(data.status);
    } catch {
      setError("Erro de rede.");
    } finally {
      setSubmitting(false);
    }
  }

  const statusLabel = existingStatus === "approved"
    ? "Aprovado"
    : existingStatus === "rejected"
      ? "Rejeitado — reenvie com correções"
      : existingStatus === "pending"
        ? "Aguardando revisão"
        : null;

  return (
    <ReadingLayout
      eyebrow="LICEU UNDERGROUND / PRODUÇÃO"
      title="Micro discurso escrito."
      subtitle="Estrutura deliberada. Tese, desenvolvimento, conclusão. Sem prolixidade."
    >
      <div className="space-y-6">
        {prompt && (
          <section className="space-y-3 border-l-4 border-[var(--liceu-secondary)] bg-[var(--liceu-surface-container)] px-6 py-5">
            <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-secondary)]">
              Prompt do módulo
            </div>
            <p className="font-[var(--font-noto-serif)] text-[15px] leading-[1.95] text-[var(--liceu-text)]">
              {prompt}
            </p>
          </section>
        )}

        <section className="space-y-3">
          <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Instrução
          </div>
          <p className="font-[var(--font-noto-serif)] text-[15px] leading-[1.95] text-[var(--liceu-text)]">
            Redija um micro discurso (150–400 palavras) aplicando o dispositivo
            central deste módulo. Uma tese clara, desenvolvimento preciso,
            conclusão sem evasão. Você também pode enviar um arquivo PDF, DOC, DOCX ou TXT.
          </p>
        </section>

        {submitted ? (
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface-container)] px-5 py-5">
            <div className={`font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] ${
              existingStatus === "approved"
                ? "text-[var(--liceu-accent)]"
                : existingStatus === "rejected"
                  ? "text-[var(--liceu-critical)]"
                  : "text-[var(--liceu-secondary)]"
            }`}>
              {statusLabel ?? "Enviado"}
            </div>
            <p className="mt-2 font-[var(--font-work-sans)] text-[13px] text-[var(--liceu-muted)]">
              {existingStatus === "rejected"
                ? "Sua produção foi devolvida com anotações. Revise e reenvie abaixo."
                : "Seu texto foi recebido e está aguardando revisão."}
            </p>
            {existingStatus === "rejected" && (
              <MinimalButton
                className="mt-4"
                variant="primary"
                onClick={() => { setSubmitted(false); setText(""); setFile(null); setExistingStatus(null); }}
              >
                Reescrever e reenviar
              </MinimalButton>
            )}
          </div>
        ) : (
          <>
            <WritingArea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Comece com a tese. Sem rodeios."
            />

            {/* File upload */}
            <section className="space-y-3">
              <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                Ou envie um arquivo
              </div>
              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  className="border border-[var(--liceu-stone)] px-4 py-2 font-[var(--font-space-grotesk)] text-xs uppercase tracking-[0.15em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] hover:border-[var(--liceu-accent)] transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {file ? file.name : "Selecionar arquivo"}
                </button>
                {file && (
                  <button
                    type="button"
                    className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.15em] text-[var(--liceu-muted)] underline underline-offset-4 hover:text-[var(--liceu-text)]"
                    onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                  >
                    Remover
                  </button>
                )}
              </div>
              {file && (
                <div className="font-[var(--font-space-grotesk)] text-[10px] text-[var(--liceu-muted)]">
                  {(file.size / 1024).toFixed(0)} KB
                </div>
              )}
            </section>

            <section className="flex items-center justify-between border-t border-[var(--liceu-stone)]/70 pt-6">
              <div className="font-[var(--font-space-grotesk)] text-[11px] tracking-[0.22em] text-[var(--liceu-muted)]">
                {wordCount} palavras
                {file && ` + 1 arquivo`}
              </div>
              <div className="flex flex-col items-end gap-2">
                {error && (
                  <p className="font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-critical)]">
                    {error}
                  </p>
                )}
                <div className="flex gap-3">
                  <MinimalButton
                    variant="quiet"
                    type="button"
                    onClick={() => { setText(""); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                    disabled={!text && !file || submitting}
                  >
                    Limpar
                  </MinimalButton>
                  <MinimalButton
                    type="button"
                    onClick={submit}
                    disabled={(!text.trim() && !file) || submitting}
                  >
                    {submitting ? "Enviando..." : "Enviar"}
                  </MinimalButton>
                </div>
              </div>
            </section>
          </>
        )}

        <p className="font-[var(--font-work-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
          Não obrigatório para avançar. Revisão humana.
        </p>
      </div>
    </ReadingLayout>
  );
}
