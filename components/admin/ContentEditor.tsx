"use client";

import { useState } from "react";
import {
  PromptsSection,
  TextSection,
  FlashcardsSection,
  LicoesSection,
  QuizSection,
} from "./content";

type FullLesson = {
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

type FullModuleData = {
  id: string;
  title: string;
  order_index: number;
  lessons: FullLesson[];
  simulations: Array<{
    module_id: string;
    title: string;
    scenario_markdown: string;
    simulation_constraint: string;
    success_criteria: unknown;
    simulation_type: string;
    related_lessons: string[];
    rhetorical_dimensions: string[];
    archetype_keys: string[];
    difficulty_tier: number;
    estimated_minutes: number;
    is_published: boolean;
  }>;
  excerpts: Array<{
    lesson_id: string;
    author: string;
    work: string;
    book: string;
    section: string;
    quote: string;
    paraphrase: string;
    concept_illustrated: string;
    language: string;
    translation_ref: string;
    is_published: boolean;
  }>;
};

type Tab = "licoes" | "prompts" | "text" | "flashcards" | "quiz";

function ModuleEditor({ module }: { module: FullModuleData }) {
  const [tab, setTab] = useState<Tab>("prompts");

  const tabs: { key: Tab; label: string }[] = [
    { key: "licoes", label: "Lições" },
    { key: "prompts", label: "Exercícios" },
    { key: "text", label: "Texto clássico" },
    { key: "flashcards", label: "Flashcards" },
    { key: "quiz", label: "Quiz" },
  ];

  return (
    <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-bg)]">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--liceu-stone)]/70">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              "px-4 py-3 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.18em] transition-colors",
              tab === t.key
                ? "text-[var(--liceu-text)] border-b-2 border-[var(--liceu-accent)]/60 -mb-px"
                : "text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5">
        {tab === "licoes" && <LicoesSection module={module} />}
        {tab === "prompts" && <PromptsSection moduleId={module.id} initial={null} />}
        {tab === "text" && <TextSection moduleId={module.id} initial={null} />}
        {tab === "flashcards" && <FlashcardsSection moduleId={module.id} />}
        {tab === "quiz" && <QuizSection moduleId={module.id} />}
      </div>
    </div>
  );
}

export function ContentEditor({ modules }: { modules: FullModuleData[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(
    modules[0]?.id ?? null,
  );

  const selected = modules.find((m) => m.id === selectedId) ?? null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
      {/* Module list sidebar */}
      <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/20">
        <div className="border-b border-[var(--liceu-stone)]/70 px-4 py-3">
          <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            Módulos
          </div>
        </div>
        <nav>
          {modules.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              className={[
                "w-full px-4 py-3 text-left border-b border-[var(--liceu-stone)]/50 last:border-b-0",
                "transition-colors",
                selectedId === m.id
                  ? "bg-[var(--liceu-surface)]/40 border-l-2 border-l-[var(--liceu-accent)]/60"
                  : "hover:bg-[var(--liceu-surface)]/20 border-l-2 border-l-transparent",
              ].join(" ")}
            >
              <div className="font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">
                Módulo {m.order_index + 1}
              </div>
              <div className="mt-0.5 font-serif text-[13px] leading-snug text-[var(--liceu-text)]">
                {m.title}
              </div>
              <div className="mt-1 flex gap-2">
                {m.simulations && m.simulations.length > 0 && (
                  <span className="font-[var(--font-liceu-mono)] text-[9px] text-[var(--liceu-accent)]/60">SIM</span>
                )}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Editor area */}
      <div>
        {selected ? (
          <div className="space-y-4">
            <div>
              <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                Editando
              </div>
              <div className="mt-1 font-serif text-[20px] text-[var(--liceu-text)]">
                {selected.title}
              </div>
            </div>
            <ModuleEditor module={selected} />
          </div>
        ) : (
          <div className="border border-[var(--liceu-stone)] px-6 py-8">
            <p className="font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-muted)]">
              Selecione um módulo para editar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}