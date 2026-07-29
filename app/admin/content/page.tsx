import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

type Module = { id: string; code: string; title: string; subtitle: string; description: string; order_index: number; estimated_hours: number; is_active: boolean };
type Lesson = { id: string; module_id: string; code: string; title: string; subtitle: string; learning_objective: string; order_index: number; difficulty_tier: number; estimated_minutes: number; is_published: boolean; rhetorical_dimension: string };
type Theory = { lesson_id: string; section_order: number; title: string };
type Flashcard = { lesson_id: string };
type Exercise = { lesson_id: string; exercise_type: string; title: string };
type Simulation = { module_id: string; title: string; simulation_type: string };
type Excerpt = { lesson_id: string; author: string; work: string };

export default async function AdminContentPage() {
  const supabase = createSupabaseAdminClient();

  const [{ data: mods }, { data: lss }, { data: th }, { data: fc }, { data: ex }, { data: sim }, { data: xp }] =
    await Promise.all([
      supabase.from("liceu_modules").select("id, code, title, subtitle, description, order_index, estimated_hours, is_active").order("order_index"),
      supabase.from("liceu_lessons").select("id, module_id, code, title, subtitle, learning_objective, order_index, difficulty_tier, estimated_minutes, is_published, rhetorical_dimension").order("order_index"),
      supabase.from("liceu_theoretical_content").select("lesson_id, section_order, title").order("section_order"),
      supabase.from("liceu_flashcards").select("lesson_id").eq("is_published", true),
      supabase.from("liceu_exercises").select("lesson_id, exercise_type, title").eq("is_published", true),
      supabase.from("liceu_simulations").select("module_id, title, simulation_type").eq("is_published", true),
      supabase.from("liceu_rhetorical_excerpts").select("lesson_id, author, work").eq("is_published", true),
    ]);

  const modules = (mods as Module[]) ?? [];
  const lessons = (lss as Lesson[]) ?? [];
  const theory = (th as Theory[]) ?? [];
  const flashcards = (fc as Flashcard[]) ?? [];
  const exercises = (ex as Exercise[]) ?? [];
  const simulations = (sim as Simulation[]) ?? [];
  const excerpts = (xp as Excerpt[]) ?? [];

  const lessonsByModule = new Map<string, Lesson[]>();
  for (const l of lessons) {
    const arr = lessonsByModule.get(l.module_id) ?? [];
    arr.push(l);
    lessonsByModule.set(l.module_id, arr);
  }

  const countByLesson = (items: { lesson_id: string }[]) => {
    const m = new Map<string, number>();
    for (const i of items) m.set(i.lesson_id, (m.get(i.lesson_id) ?? 0) + 1);
    return m;
  };
  const theoryCount = countByLesson(theory);
  const flashCount = countByLesson(flashcards);
  const exerCount = countByLesson(exercises);
  const exceCount = countByLesson(excerpts);

  const simsByModule = new Map<string, Simulation[]>();
  for (const s of simulations) {
    const arr = simsByModule.get(s.module_id) ?? [];
    arr.push(s);
    simsByModule.set(s.module_id, arr);
  }

  return (
    <div className="p-4 md:p-6 space-y-10">
      <header className="border-b border-[var(--liceu-stone)]/70 pb-4">
        <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          /admin/content
        </div>
        <div className="mt-2 font-serif text-[22px] leading-tight text-[var(--liceu-text)]">
          Conteúdo do Liceu Underground
        </div>
        <div className="mt-2 font-[var(--font-liceu-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
          {modules.length} módulos · {lessons.length} lições · {theory.length} textos teóricos · {flashcards.length} flashcards · {exercises.length} exercícios · {simulations.length} simulações · {excerpts.length} excertos
        </div>
      </header>

      {modules.length === 0 ? (
        <div className="border border-[var(--liceu-stone)] p-6 text-center">
          <p className="font-[var(--font-liceu-sans)] text-[14px] text-[var(--liceu-muted)]">
            Nenhum módulo encontrado. Execute as seeds primeiro.
          </p>
        </div>
      ) : (
        modules.map((m) => {
          const ml = lessonsByModule.get(m.id) ?? [];
          const ms = simsByModule.get(m.id) ?? [];
          return (
            <section key={m.id} className="border border-[var(--liceu-stone)]">
              <div className="border-b border-[var(--liceu-stone)]/70 px-5 py-4 bg-[var(--liceu-surface)]/10">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <div className="font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">
                      Módulo {m.order_index + 1} · {m.code}
                    </div>
                    <div className="mt-1 font-serif text-[18px] leading-tight text-[var(--liceu-text)]">
                      {m.title}
                    </div>
                    {m.subtitle && (
                      <div className="mt-0.5 font-serif text-[13px] italic text-[var(--liceu-muted)]/80">
                        {m.subtitle}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3 font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.12em] text-[var(--liceu-muted)]/60 shrink-0">
                    <span>{ml.length} lições</span>
                    <span>{m.estimated_hours}h</span>
                    {ms.length > 0 && <span>{ms.length} simulações</span>}
                    <span className={m.is_active ? "text-emerald-600" : "text-amber-600"}>
                      {m.is_active ? "ativo" : "inativo"}
                    </span>
                  </div>
                </div>
                {m.description && (
                  <div className="mt-2 font-[var(--font-liceu-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]/70">
                    {m.description}
                  </div>
                )}
              </div>

              {ml.length === 0 ? (
                <div className="px-5 py-4 font-[var(--font-liceu-sans)] text-[12px] text-[var(--liceu-muted)]">
                  Nenhuma lição cadastrada.
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--liceu-stone)]/40 bg-[var(--liceu-surface)]/5">
                      <th className="py-2.5 pl-5 pr-3 w-10 font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.12em] text-[var(--liceu-muted)]">#</th>
                      <th className="py-2.5 pr-3 font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.12em] text-[var(--liceu-muted)]">Código</th>
                      <th className="py-2.5 pr-3 font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.12em] text-[var(--liceu-muted)]">Lição</th>
                      <th className="py-2.5 pr-3 w-20 font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.12em] text-[var(--liceu-muted)]">Dimensão</th>
                      <th className="py-2.5 pr-3 w-14 font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.12em] text-[var(--liceu-muted)]">Dif.</th>
                      <th className="py-2.5 pr-3 w-14 font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.12em] text-[var(--liceu-muted)]">Min.</th>
                      <th className="py-2.5 pr-5 font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.12em] text-[var(--liceu-muted)]">Conteúdo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ml.map((l) => {
                      const tc = theoryCount.get(l.id) ?? 0;
                      const fc = flashCount.get(l.id) ?? 0;
                      const ec = exerCount.get(l.id) ?? 0;
                      const xc = exceCount.get(l.id) ?? 0;
                      const parts: string[] = [];
                      if (tc > 0) parts.push(`${tc} textos`);
                      if (fc > 0) parts.push(`${fc} cards`);
                      if (ec > 0) parts.push(`${ec} exercícios`);
                      if (xc > 0) parts.push(`${xc} excertos`);
                      return (
                        <tr key={l.id} className="border-b border-[var(--liceu-stone)]/15 hover:bg-[var(--liceu-surface)]/5 transition-colors">
                          <td className="py-2 pl-5 pr-3 font-[var(--font-liceu-mono)] text-[10px] tabular-nums text-[var(--liceu-muted)]">
                            {l.order_index + 1}
                          </td>
                          <td className="py-2 pr-3 font-[var(--font-liceu-mono)] text-[10px] tabular-nums text-[var(--liceu-muted)]/60">
                            {l.code}
                          </td>
                          <td className="py-2 pr-3">
                            <div className="font-serif text-[13px] text-[var(--liceu-text)]">{l.title}</div>
                            {l.subtitle && (
                              <div className="font-serif text-[11px] italic text-[var(--liceu-muted)]/60">{l.subtitle}</div>
                            )}
                          </td>
                          <td className="py-2 pr-3 font-[var(--font-liceu-mono)] text-[9px] text-[var(--liceu-muted)]/70">
                            {l.rhetorical_dimension || "—"}
                          </td>
                          <td className="py-2 pr-3 font-[var(--font-liceu-mono)] text-[10px] tabular-nums text-[var(--liceu-muted)]">
                            {l.difficulty_tier}/5
                          </td>
                          <td className="py-2 pr-3 font-[var(--font-liceu-mono)] text-[10px] tabular-nums text-[var(--liceu-muted)]">
                            {l.estimated_minutes}′
                          </td>
                          <td className="py-2 pr-5 font-[var(--font-liceu-mono)] text-[9px] text-[var(--liceu-muted)]/60">
                            {parts.length > 0 ? parts.join(" · ") : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* Simulations for this module */}
              {ms.length > 0 && (
                <div className="border-t border-[var(--liceu-stone)]/40 px-5 py-3">
                  <div className="font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.15em] text-[var(--liceu-muted)] mb-2">
                    Simulações
                  </div>
                  <div className="space-y-1.5">
                    {ms.map((s, i) => (
                      <div key={i} className="flex gap-2 font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]/80">
                        <span className="font-[var(--font-liceu-mono)] text-[9px] text-[var(--liceu-accent)]/60">{s.simulation_type}</span>
                        <span>{s.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}