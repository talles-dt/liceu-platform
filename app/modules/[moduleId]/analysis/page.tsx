"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";

type AnnotationEntry = {
  device: string;
  location: string;
  function: string;
};

type TextData = {
  id: string;
  title: string;
  author: string | null;
  content: string;
};

type Submission = {
  id: string;
  content: string;
  status: string;
} | null;

function AnnotationRow({
  entry,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  entry: AnnotationEntry;
  index: number;
  onChange: (i: number, field: keyof AnnotationEntry, val: string) => void;
  onRemove: (i: number) => void;
  canRemove: boolean;
}) {
  const inputClass = [
    "w-full border-none bg-transparent",
    "font-[var(--font-liceu-sans)] text-[13px] text-[var(--liceu-text)]",
    "placeholder:text-[var(--liceu-muted)]/50 focus:outline-none",
  ].join(" ");

  const cellClass =
    "border-r border-[var(--liceu-stone)]/60 px-3 py-2 last:border-r-0";

  return (
    <tr className="border-b border-[var(--liceu-stone)]/50 last:border-b-0">
      <td className={cellClass + " w-6 text-center"}>
        <span className="font-[var(--font-liceu-mono)] text-[10px] text-[var(--liceu-muted)]">
          {index + 1}
        </span>
      </td>
      <td className={cellClass}>
        <input
          value={entry.device}
          onChange={(e) => onChange(index, "device", e.target.value)}
          placeholder="ex: anáfora"
          className={inputClass}
        />
      </td>
      <td className={cellClass}>
        <input
          value={entry.location}
          onChange={(e) => onChange(index, "location", e.target.value)}
          placeholder="parágrafo 2, linha 3"
          className={inputClass}
        />
      </td>
      <td className={cellClass}>
        <input
          value={entry.function}
          onChange={(e) => onChange(index, "function", e.target.value)}
          placeholder="reforça a urgência..."
          className={inputClass}
        />
      </td>
      <td className="px-2 py-2 text-center">
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="font-[var(--font-liceu-mono)] text-[10px] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]"
          >
            ✕
          </button>
        )}
      </td>
    </tr>
  );
}

function emptyEntry(): AnnotationEntry {
  return { device: "", location: "", function: "" };
}

export default function AnalysisPage() {
  const params = useParams<{ moduleId: string }>();
  const moduleId = params?.moduleId ?? "";

  const [loading, setLoading] = useState(true);
  const [text, setText] = useState<TextData | null>(null);
  const [existing, setExisting] = useState<Submission>(null);
  const [annotations, setAnnotations] = useState<AnnotationEntry[]>([emptyEntry()]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/modules/${moduleId}/analysis`);
        if (res.status === 404) {
          setLoading(false);
          return;
        }
        const data = await res.json() as { text: TextData; submission: Submission };
        setText(data.text);
        setExisting(data.submission);
        if (data.submission?.content) {
          try {
            const parsed = JSON.parse(data.submission.content) as {
              annotations: AnnotationEntry[];
              notes: string;
            };
            setAnnotations(parsed.annotations);
            setNotes(parsed.notes ?? "");
          } catch {
            // content wasn't JSON — ignore
          }
        }
      } catch {
        setError("Erro ao carregar.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [moduleId]);

  function updateAnnotation(i: number, field: keyof AnnotationEntry, val: string) {
    setAnnotations((prev) => prev.map((e, idx) => (idx === i ? { ...e, [field]: val } : e)));
  }

  function addRow() {
    setAnnotations((prev) => [...prev, emptyEntry()]);
  }

  function removeRow(i: number) {
    setAnnotations((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setError("");
    const valid = annotations.filter(
      (a) => a.device.trim() && a.location.trim() && a.function.trim(),
    );
    if (valid.length === 0) {
      setError("Preencha pelo menos uma linha completa.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/modules/${moduleId}/analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annotations: valid, notes }),
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

  if (loading) {
    return (
      <ReadingLayout eyebrow="LICEU / ANÁLISE" title="Carregando..." subtitle="">
        <p className="font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-muted)]">
          Buscando texto...
        </p>
      </ReadingLayout>
    );
  }

  if (!text) {
    return (
      <ReadingLayout eyebrow="LICEU / ANÁLISE" title="Sem texto" subtitle="">
        <p className="font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-muted)]">
          Nenhum texto clássico atribuído a este módulo ainda.
        </p>
      </ReadingLayout>
    );
  }

  const alreadySubmitted = existing?.status === "pending" || existing?.status === "approved";

  return (
    <ReadingLayout
      eyebrow="LICEU / ANÁLISE DE TEXTO"
      title={text.title}
      subtitle={text.author ?? "Texto clássico para análise retórica."}
    >
      <div className="space-y-10">
        {/* Classical text */}
        <section className="space-y-3">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Texto
          </div>
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 px-5 py-5">
            <p className="whitespace-pre-wrap font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]">
              {text.content}
            </p>
          </div>
        </section>

        {/* Annotation table */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Anotações retóricas
            </div>
            <div className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
              Identifique, localize e explique cada dispositivo.
            </div>
          </div>

          <div className="overflow-auto border border-[var(--liceu-stone)]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[var(--liceu-stone)]/70">
                  <th className="px-3 py-2 text-left font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)] w-6">
                    #
                  </th>
                  <th className="px-3 py-2 text-left font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
                    Dispositivo retórico
                  </th>
                  <th className="px-3 py-2 text-left font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
                    Localização no texto
                  </th>
                  <th className="px-3 py-2 text-left font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]">
                    Função / efeito
                  </th>
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody>
                {annotations.map((entry, i) => (
                  <AnnotationRow
                    key={i}
                    entry={entry}
                    index={i}
                    onChange={updateAnnotation}
                    onRemove={removeRow}
                    canRemove={annotations.length > 1 && !alreadySubmitted && !submitted}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {!alreadySubmitted && !submitted && (
            <button
              onClick={addRow}
              className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]"
            >
              + Adicionar linha
            </button>
          )}
        </section>

        {/* Notes */}
        <section className="space-y-3">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Notas gerais (opcional)
          </div>
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 px-4 py-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={alreadySubmitted || submitted}
              rows={4}
              placeholder="Impressões gerais, padrões, o que o texto demonstra sobre o método do autor..."
              className="w-full resize-none border-none bg-transparent font-serif text-[14px] leading-[1.85] text-[var(--liceu-text)] placeholder:text-[var(--liceu-muted)]/50 focus:outline-none disabled:opacity-60"
            />
          </div>
        </section>

        {/* Submit */}
        <section className="flex items-center justify-between border-t border-[var(--liceu-stone)]/70 pt-6">
          <div className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
            {submitted || alreadySubmitted
              ? `Enviado — ${existing?.status === "approved" ? "aprovado" : "aguardando revisão"}`
              : "Não obrigatório para avançar. Revisão humana."}
          </div>
          {!submitted && !alreadySubmitted && (
            <div className="flex flex-col items-end gap-2">
              {error && (
                <p className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
                  {error}
                </p>
              )}
              <MinimalButton onClick={submit} disabled={submitting}>
                {submitting ? "Enviando..." : "Enviar análise"}
              </MinimalButton>
            </div>
          )}
        </section>
      </div>
    </ReadingLayout>
  );
}
