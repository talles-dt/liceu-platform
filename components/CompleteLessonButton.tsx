"use client";

import { useEffect, useState } from "react";

type Props = {
  moduleId: string;
  lessonId: string;
};

export function CompleteLessonButton({ moduleId, lessonId }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting || completed) return;

    setSubmitting(true);
    setError("");

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const body = new URLSearchParams();
      formData.forEach((value, key) => {
        body.append(key, value as string);
      });

      const res = await fetch(`/api/modules/${moduleId}/lessons/${lessonId}/complete`, {
        method: "POST",
        body,
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setCompleted(true);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao marcar");
    } finally {
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-accent)]">
        ✓ Lição concluída
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <button
        type="submit"
        disabled={submitting}
        className="border border-[var(--liceu-stone)] px-4 py-2 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] hover:border-[var(--liceu-accent)] transition-colors disabled:opacity-60"
      >
        {submitting ? "Marcando..." : "Marcar como concluída"}
      </button>
      {error && (
        <span className="font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
          {error}
        </span>
      )}
    </form>
  );
}
