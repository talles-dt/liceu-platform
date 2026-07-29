"use client";

import { useState } from "react";
import { Field, SaveButton } from "./shared";

type SimpleLesson = {
  id: string;
  module_id: string;
  code: string;
  title: string;
  subtitle: string;
  learning_objective: string;
  rhetorical_dimension: string;
  archetype_keys: string[];
  difficulty_tier: number;
  estimated_minutes: number;
  prerequisites: string[];
  order_index: number;
  is_published: boolean;
};

export function LicoesSection({ module }: { module: { lessons: SimpleLesson[] } }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { content: string }>>({});

  const lessons = module.lessons ?? [];

  if (lessons.length === 0) {
    return (
      <p className="font-[var(--font-liceu-sans)] text-[12px] text-[var(--liceu-muted)]">
        Nenhuma lição cadastrada para este módulo. Adicione lições via seed ou Supabase.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {lessons.map((lesson) => {
        const draft = drafts[lesson.id] ?? { content: "" };
        const isEditing = editingId === lesson.id;

        return (
          <div key={lesson.id} className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/20">
            {/* Lesson header */}
            <div className="flex items-center justify-between gap-4 border-b border-[var(--liceu-stone)]/70 px-4 py-3">
              <div className="space-y-0.5">
                <div className="font-serif text-[14px] text-[var(--liceu-text)]">
                  {lesson.order_index + 1}. {lesson.title}
                </div>
                <div className="flex gap-3">
                  <span className="font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.15em] text-[var(--liceu-accent)]/70">
                    {lesson.code}
                  </span>
                  <span className="font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]/50">
                    {lesson.difficulty_tier}/5
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingId(isEditing ? null : lesson.id)}
                className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]"
              >
                {isEditing ? "Fechar" : "Editar"}
              </button>
            </div>

            {/* Edit form */}
            {isEditing && (
              <div className="px-4 py-5 space-y-4">
                <Field
                  label="Conteúdo da lição (Markdown)"
                  value={draft.content}
                  onChange={(v) => setDrafts((p) => ({ ...p, [lesson.id]: { ...draft, content: v } }))}
                  rows={16}
                  placeholder="## Título da seção&#10;&#10;Conteúdo do capítulo em markdown..."
                  mono={false}
                />
                <div className="flex items-center gap-3">
                  <SaveButton
                    onClick={() => saveLesson(lesson.id, draft.content)}
                    saving={false}
                    saved={false}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

async function saveLesson(lessonId: string, content: string) {
  try {
    const res = await fetch(`/api/admin/content/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_id: lessonId, content }),
    });
    if (!res.ok) {
      const d = await res.json();
      console.error(d.error ?? "Erro");
    }
  } catch {
    console.error("Erro de rede.");
  }
}