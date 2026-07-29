import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

type DbModule = {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  order_index: number;
  estimated_hours: number;
  is_active: boolean;
};

type DbLesson = {
  id: string;
  module_id: string;
  code: string;
  title: string;
  subtitle: string;
  learning_objective: string;
  order_index: number;
  difficulty_tier: number;
  estimated_minutes: number;
  is_published: boolean;
};

export default async function AdminContentPage() {
  const supabase = createSupabaseAdminClient();

  const [{ data: modules }, { data: lessons }, { data: theory }, { data: flashcards }, { data: exercises }, { data: simulations }, { data: excerpts }] =
    await Promise.all([
      supabase.from("liceu_modules").select("id, code, title, subtitle, description, order_index, estimated_hours, is_active").order("order_index"),
      supabase.from("liceu_lessons").select("id, module_id, code, title, subtitle, learning_objective, order_index, difficulty_tier, estimated_minutes, is_published").order("order_index"),
      supabase.from("liceu_theoretical_content").select("lesson_id, section_order, title, content_markdown").order("section_order"),
      supabase.from("liceu_flashcards").select("lesson_id, front, back, concept").eq("is_published", true),
      supabase.from("liceu_exercises").select("lesson_id, title, exercise_type").eq("is_published", true),
      supabase.from("liceu_simulations").select("module_id, title").eq("is_published", true),
      supabase.from("liceu_rhetorical_excerpts").select("lesson_id, author, work").eq("is_published", true),
    ]);

  const mods = (modules as DbModule[]) ?? [];
  const lssns = (lessons as DbLesson[]) ?? [];
  const theoryList = (theory as { lesson_id: string; section_order: number; title: string; content_markdown: string }[]) ?? [];
  const flashcardList = (flashcards as { lesson_id: string }[]) ?? [];
  const exerciseList = (exercises as { lesson_id: string }[]) ?? [];
  const simulationList = (simulations as { module_id: string }[]) ?? [];
  const excerptList = (excerpts as { lesson_id: string }[]) ?? [];

  // Group by module
  const lessonsByModule = new Map<string, DbLesson[]>();
  for (const l of lssns) {
    if (!lessonsByModule.has(l.module_id)) lessonsByModule.set(l.module_id, []);
    lessonsByModule.get(l.module_id)!.push(l);
  }
  const theoryByLesson = new Map<string, number>();
  for (const t of theoryList) theoryByLesson.set(t.lesson_id, (theoryByLesson.get(t.lesson_id) ?? 0) + 1);
  const flashcardsByLesson = new Map<string, number>();
  for (const f of flashcardList) flashcardsByLesson.set(f.lesson_id, (flashcardsByLesson.get(f.lesson_id) ?? 0) + 1);
  const exercisesByLesson = new Map<string, number>();
  for (const e of exerciseList) exercisesByLesson.set(e.lesson_id, (exercisesByLesson.get(e.lesson_id) ?? 0) + 1);
  const simulationsByModule = new Map<string, number>();
  for (const s of simulationList) simulationsByModule.set(s.module_id, (simulationsByModule.get(s.module_id) ?? 0) + 1);
  const excerptsByLesson = new Map<string, number>();
  for (const e of excerptList) excerptsByLesson.set(e.lesson_id, (excerptsByLesson.get(e.lesson_id) ?? 0) + 1);

  return (
    <div className="p-4 md:p-6">
      <header className="border-b border-[var(--liceu-stone)]/70 pb-4">
        <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          /admin/content
        </div>
        <div className="mt-2 font-serif text-[22px] leading-tight text-[var(--liceu-text)]">
          Conteúdo do Liceu Underground
        </div>
        <div className="mt-2 font-[var(--font-liceu-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
          {mods.length} módulos &middot; {lssns.length} lições &middot; {theoryList.length} textos teóricos &middot; {flashcardList.length} flashcards &middot; {exerciseList.length} exercícios &middot; {simulationList.length} simulações &middot; {excerptList.length} excertos
        </div>
      </header>

      <div className="mt-6 space-y-8">
        {mods.map((m, mi) => {
          const moduleLessons = lessonsByModule.get(m.id) ?? [];
          const moduleSims = simulationsByModule.get(m.id) ?? 0;
          return (
            <section key={m.id} className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/20">
              <div className="border-b border-[var(--liceu-stone)]/70 px-5 py-4">
                <div className="font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">
                  Módulo {mi + 1}
                </div>
                <div className="mt-1 font-serif text-[18px] text-[var(--liceu-text)]">
                  {m.code}. {m.title}
                </div>
                {m.subtitle && (
                  <div className="mt-1 font-serif text-[14px] italic text-[var(--liceu-muted)]">
                    {m.subtitle}
                  </div>
                )}
                <div className="mt-2 flex gap-3 font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.12em] text-[var(--liceu-muted)]/60">
                  <span>{moduleLessons.length} lições</span>
                  <span>{m.estimated_hours}h</span>
                  {moduleSims > 0 && <span>{moduleSims} simulações</span>}
                  <span className={m.is_active ? "text-green-600" : "text-red-600"}>
                    {m.is_active ? "ativo" : "inativo"}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--liceu-stone)]/40">
                      <th className="pb-2 pr-4 font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.12em] text-[var(--liceu-muted)] w-12">#</th>
                      <th className="pb-2 pr-4 font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.12em] text-[var(--liceu-muted)]">Lição</th>
                      <th className="pb-2 pr-4 font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.12em] text-[var(--liceu-muted)] w-16">Dific.</th>
                      <th className="pb-2 pr-4 font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.12em] text-[var(--liceu-muted)] w-16">Min.</th>
                      <th className="pb-2 font-[var(--font-liceu-mono)] text-[9px] uppercase tracking-[0.12em] text-[var(--liceu-muted)]">Conteúdo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moduleLessons.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="pt-4 font-[var(--font-liceu-sans)] text-[12px] text-[var(--liceu-muted)]">
                          Nenhuma lição cadastrada.
                        </td>
                      </tr>
                    ) : (
                      moduleLessons.map((l) => {
                        const tCount = theoryByLesson.get(l.id) ?? 0;
                        const fCount = flashcardsByLesson.get(l.id) ?? 0;
                        const eCount = exercisesByLesson.get(l.id) ?? 0;
                        const xCount = excerptsByLesson.get(l.id) ?? 0;
                        const parts: string[] = [];
                        if (tCount > 0) parts.push(`${tCount} textos`);
                        if (fCount > 0) parts.push(`${fCount} flashcards`);
                        if (eCount > 0) parts.push(`${eCount} exercícios`);
                        if (xCount > 0) parts.push(`${xCount} excertos`);
                        return (
                          <tr key={l.id} className="border-b border-[var(--liceu-stone)]/20 last:border-0">
                            <td className="py-2 pr-4 font-[var(--font-liceu-mono)] text-[10px] text-[var(--liceu-muted)]">{l.order_index + 1}</td>
                            <td className="py-2 pr-4">
                              <div className="font-serif text-[13px] text-[var(--liceu-text)]">{l.title}</div>
                              {l.subtitle && <div className="font-serif text-[11px] italic text-[var(--liceu-muted)]/70">{l.subtitle}</div>}
                            </td>
                            <td className="py-2 pr-4 font-[var(--font-liceu-mono)] text-[10px] tabular-nums text-[var(--liceu-muted)]">{l.difficulty_tier}/5</td>
                            <td className="py-2 pr-4 font-[var(--font-liceu-mono)] text-[10px] tabular-nums text-[var(--liceu-muted)]">{l.estimated_minutes}</td>
                            <td className="py-2 font-[var(--font-liceu-mono)] text-[9px] text-[var(--liceu-muted)]/70">
                              {parts.length > 0 ? parts.join(" · ") : l.is_published ? "—" : "não publicado"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}