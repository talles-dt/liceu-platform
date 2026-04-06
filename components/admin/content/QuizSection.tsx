"use client";

import { useState } from "react";
import { Field } from "./shared";

type QuestionRow = {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
  correct_option_id: string;
  order_index: number;
};

export function QuizSection({ moduleId }: { moduleId: string }) {
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // New question form state
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState([
    { id: "a", label: "" },
    { id: "b", label: "" },
    { id: "c", label: "" },
  ]);
  const [correctId, setCorrectId] = useState("a");
  const [adding, setAdding] = useState(false);

  async function loadQuestions() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/content/quiz/${moduleId}`);
      if (res.ok) { const d = await res.json(); setQuestions(d.questions ?? []); setLoaded(true); }
    } catch { setError("Erro ao carregar."); }
    finally { setLoading(false); }
  }

  async function addQuestion() {
    const validOptions = options.filter((o) => o.label.trim());
    if (!prompt.trim() || validOptions.length < 2) {
      setError("Pergunta e pelo menos 2 opções obrigatórias.");
      return;
    }
    setAdding(true); setError("");
    try {
      const res = await fetch(`/api/admin/content/quiz/${moduleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          options: validOptions,
          correct_option_id: correctId,
          order_index: questions.length,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setQuestions((prev) => [...prev, d.question]);
        setPrompt("");
        setOptions([{ id: "a", label: "" }, { id: "b", label: "" }, { id: "c", label: "" }]);
        setCorrectId("a");
      } else { const d = await res.json(); setError(d.error ?? "Erro"); }
    } catch { setError("Erro de rede."); }
    finally { setAdding(false); }
  }

  async function deleteQuestion(qId: string) {
    try {
      await fetch(`/api/admin/content/quiz/${moduleId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question_id: qId }),
      });
      setQuestions((prev) => prev.filter((q) => q.id !== qId));
    } catch { setError("Erro ao deletar."); }
  }

  if (!loaded) {
    return (
      <button
        onClick={loadQuestions}
        disabled={loading}
        className="border border-[var(--liceu-stone)] px-4 py-2 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] disabled:opacity-40"
      >
        {loading ? "Carregando..." : "Carregar perguntas"}
      </button>
    );
  }

  return (
    <div className="space-y-6">
      {error && <p className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">{error}</p>}

      {/* Existing questions */}
      {questions.length === 0 ? (
        <p className="font-[var(--font-liceu-sans)] text-[12px] text-[var(--liceu-muted)]">Nenhuma pergunta ainda.</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <div key={q.id} className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/20 px-4 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">
                    Pergunta {i + 1}
                  </div>
                  <p className="font-serif text-[14px] text-[var(--liceu-text)]">{q.prompt}</p>
                  <div className="space-y-1">
                    {q.options.map((opt) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <span className={[
                          "font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.15em]",
                          opt.id === q.correct_option_id ? "text-[var(--liceu-accent)]" : "text-[var(--liceu-muted)]",
                        ].join(" ")}>
                          {opt.id === q.correct_option_id ? "✓" : "○"}
                        </span>
                        <span className="font-[var(--font-liceu-sans)] text-[12px] text-[var(--liceu-muted)]">{opt.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => deleteQuestion(q.id)}
                  className="shrink-0 font-[var(--font-liceu-mono)] text-[10px] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new question */}
      <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/10 px-4 py-5 space-y-4">
        <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
          Nova pergunta
        </div>
        <Field label="Pergunta" value={prompt} onChange={setPrompt} rows={2} placeholder="Qual é a função do ethos?" />

        <div className="space-y-2">
          <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
            Opções — marque a correta
          </div>
          {options.map((opt, i) => (
            <div key={opt.id} className="flex items-center gap-3">
              <input
                type="radio"
                name={`correct-${moduleId}`}
                checked={correctId === opt.id}
                onChange={() => setCorrectId(opt.id)}
                className="h-3 w-3 accent-[var(--liceu-accent)]"
              />
              <input
                type="text"
                value={opt.label}
                onChange={(e) => setOptions((prev) => prev.map((o, j) => j === i ? { ...o, label: e.target.value } : o))}
                placeholder={`Opção ${opt.id.toUpperCase()}`}
                className="flex-1 border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] px-3 py-1.5 font-[var(--font-liceu-sans)] text-[12px] text-[var(--liceu-text)] placeholder:text-[var(--liceu-muted)]/50 focus:outline-none"
              />
            </div>
          ))}
          <button
            onClick={() => setOptions((prev) => [...prev, { id: String.fromCharCode(97 + prev.length), label: "" }])}
            className="font-[var(--font-liceu-mono)] text-[10px] tracking-[0.18em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]"
          >
            + Adicionar opção
          </button>
        </div>

        <button
          onClick={addQuestion}
          disabled={adding}
          className="border border-[var(--liceu-stone)] px-4 py-2 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] disabled:opacity-40"
        >
          {adding ? "Adicionando..." : "Adicionar pergunta"}
        </button>
      </div>
    </div>
  );
}
