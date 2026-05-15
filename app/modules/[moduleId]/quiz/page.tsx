"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";

type Question = {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
};

export default function QuizPage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params?.moduleId ?? "";

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/modules/${moduleId}/quiz`);
        if (!res.ok) {
          setError("Erro ao carregar perguntas.");
          return;
        }
        const data = await res.json();
        setQuestions(data.questions ?? []);
      } catch {
        setError("Erro de rede.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [moduleId]);

  const selectAnswer = useCallback((questionId: string, optionId: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }, []);

  async function submitQuiz() {
    if (questions.length === 0) return;
    const allAnswered = questions.every((q) => answers[q.id]);
    if (!allAnswered) {
      setError("Responda todas as perguntas.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/modules/${moduleId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setError(d.error ?? "Erro ao enviar.");
        return;
      }
      const data = await res.json();
      setScore(data.score);
      setSubmitted(true);
    } catch {
      setError("Erro de rede.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <ReadingLayout
        eyebrow="LICEU / QUIZ"
        title="Quiz de Validação"
        subtitle="Carregando perguntas..."
      >
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-[var(--liceu-surface-container)]" />
          ))}
        </div>
      </ReadingLayout>
    );
  }

  if (questions.length === 0) {
    return (
      <ReadingLayout
        eyebrow="LICEU / QUIZ"
        title="Quiz de Validação"
        subtitle="Nenhuma pergunta cadastrada para este módulo."
      >
        <p className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)]">
          Aguarde o administrador cadastrar as perguntas.
        </p>
      </ReadingLayout>
    );
  }

  const allAnswered = questions.every((q) => answers[q.id]);
  const progress = Math.round((Object.keys(answers).length / questions.length) * 100);

  return (
    <ReadingLayout
      eyebrow="LICEU / QUIZ"
      title="Quiz de Validação"
      subtitle="Responda todas as perguntas. Nota mínima: 70%."
    >
      <div className="space-y-8">
        {/* Progress bar */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-[var(--liceu-surface-container-highest)]">
            <div
              className="h-full bg-[var(--liceu-accent)] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] tabular-nums">
            {Object.keys(answers).length}/{questions.length}
          </div>
        </div>

        {/* Questions */}
        {questions.map((q, qi) => (
          <section key={q.id} className="space-y-3">
            <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Pergunta {qi + 1}
            </div>
            <p className="font-[var(--font-noto-serif)] text-[16px] leading-[1.7] text-[var(--liceu-text)]">
              {q.prompt}
            </p>
            <div className="space-y-2">
              {q.options.map((opt) => (
                <label
                  key={opt.id}
                  className={[
                    "flex cursor-pointer items-start gap-3 border px-4 py-3 transition-colors",
                    "border-[var(--liceu-stone)] bg-[var(--liceu-surface-container)]",
                    "hover:border-[var(--liceu-accent)]/60",
                    answers[q.id] === opt.id
                      ? "border-[var(--liceu-accent)] bg-[var(--liceu-surface-container-high)]"
                      : "",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    value={opt.id}
                    checked={answers[q.id] === opt.id}
                    onChange={() => selectAnswer(q.id, opt.id)}
                    className="mt-1 h-3 w-3 accent-[var(--liceu-accent)]"
                  />
                  <span className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)]">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </section>
        ))}

        {/* Submit / Result */}
        <section className="flex items-center justify-between border-t border-[var(--liceu-stone)] pt-6">
          {error && (
            <p className="font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-critical)]">
              {error}
            </p>
          )}
          {!submitted ? (
            <div className="ml-auto">
              <MinimalButton
                onClick={submitQuiz}
                disabled={!allAnswered || submitting}
              >
                {submitting ? "Enviando..." : "Enviar Quiz"}
              </MinimalButton>
            </div>
          ) : null}
        </section>

        {submitted && score !== null && (
          <section className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface-container)] px-5 py-5">
            <div className={`font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] ${
              score >= 70
                ? "text-[var(--liceu-accent)]"
                : "text-[var(--liceu-critical)]"
            }`}>
              {score >= 70 ? "APROVADO" : "NÃO APROVADO"}
            </div>
            <div className="mt-2 font-[var(--font-noto-serif)] text-3xl text-[var(--liceu-text)]">
              {score}%
            </div>
            <p className="mt-2 font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-muted)]">
              {score >= 70
                ? "Parabéns. Você pode avançar para o próximo módulo."
                : "Nota mínima: 70%. Revise o conteúdo e tente novamente. Tentativas ilimitadas."}
            </p>
          </section>
        )}
      </div>
    </ReadingLayout>
  );
}
