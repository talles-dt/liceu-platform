import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";

export default async function LessonPage(props: { params: Promise<{ moduleId: string; lessonId: string }> }) {
  const { moduleId, lessonId } = await props.params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();

  // Load lesson + module + theory
  const [{ data: lesson }, { data: mod }, { data: theory }] = await Promise.all([
    supabase.from("liceu_lessons")
      .select("id, title, subtitle, learning_objective, order_index, module_id, difficulty_tier, estimated_minutes, rhetorical_dimension")
      .eq("id", lessonId).eq("module_id", moduleId).maybeSingle(),
    supabase.from("liceu_modules")
      .select("id, title, order_index").eq("id", moduleId).maybeSingle(),
    supabase.from("liceu_theoretical_content")
      .select("content_markdown, title").eq("lesson_id", lessonId).order("section_order").limit(1).maybeSingle(),
  ]);

  if (!lesson || !mod) notFound();

  const contentMd = (theory as { content_markdown?: string } | null)?.content_markdown ?? null;
  const contentHtml = contentMd
    ? DOMPurify.sanitize(await marked(contentMd, { breaks: true }))
    : null;

  // Progress
  const { data: prog } = await supabase.from("liceu_learner_progression")
    .select("completed_lessons").eq("user_id", user.id).maybeSingle();
  const completed = ((prog as { completed_lessons?: string[] } | null)?.completed_lessons ?? []).includes(lessonId);

  // All lessons for nav
  const { data: allLessons } = await supabase.from("liceu_lessons")
    .select("id, title, order_index").eq("module_id", moduleId).eq("is_published", true).order("order_index");
  const lessons = (allLessons ?? []) as { id: string; title: string; order_index: number }[];
  const idx = lessons.findIndex(l => l.id === lessonId);
  const prev = idx > 0 ? lessons[idx - 1] : null;
  const next = idx < lessons.length - 1 ? lessons[idx + 1] : null;

  const dimLabel: Record<string, string> = { inventio: "Inventio", dispositio: "Dispositio", elocutio: "Elocutio", memoria: "Memória", pronuntiatio: "Pronuntiatio" };

  return (
    <div className="min-h-screen bg-[var(--liceu-bg)] text-[var(--liceu-text)]">
      <div className="max-w-4xl mx-auto p-8 md:p-16">
        <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] mb-8">
          <a href="/dashboard" className="hover:text-[var(--liceu-text)]">dashboard</a>
          {" / "}<a href={`/modules/${moduleId}`} className="hover:text-[var(--liceu-text)]">{mod.title}</a>
          {" / "}<span className="text-[var(--liceu-text)]">lição {lesson.order_index + 1}</span>
        </div>

        <header className="mb-12">
          <h1 className="font-[var(--font-noto-serif)] text-3xl md:text-5xl leading-tight">{lesson.title}</h1>
          {lesson.subtitle && <p className="mt-3 font-[var(--font-noto-serif)] text-xl italic text-[var(--liceu-muted)]">{lesson.subtitle}</p>}
          <div className="mt-4 flex flex-wrap gap-4 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">
            <span>Dificuldade {lesson.difficulty_tier}/5</span>
            <span>{lesson.estimated_minutes} min</span>
            {lesson.rhetorical_dimension && <span>{dimLabel[lesson.rhetorical_dimension] || lesson.rhetorical_dimension}</span>}
          </div>
        </header>

        <article className="space-y-8">
          {contentHtml ? (
            <section className="prose-liceu" dangerouslySetInnerHTML={{ __html: contentHtml }} />
          ) : (
            <div className="border border-[var(--liceu-stone)]/50 p-6 font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-muted)]">
              <p>O conteúdo teórico desta lição está sendo preparado.</p>
              {lesson.learning_objective && <p className="mt-2"><strong>Objetivo:</strong> {lesson.learning_objective}</p>}
            </div>
          )}

          <section className="border-t border-[var(--liceu-stone)]/70 pt-6">
            {completed ? (
              <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-accent)]">✓ Lição concluída</div>
            ) : (
              <form action={`/api/lessons/${lessonId}/quiz`} method="post">
                <input type="hidden" name="answers" value="{}" />
                <button type="submit" className="border border-[var(--liceu-stone)] px-4 py-2 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] hover:border-[var(--liceu-accent)] transition-colors">
                  Marcar como concluída
                </button>
              </form>
            )}
          </section>
        </article>

        <nav className="flex items-center justify-between border-t border-[var(--liceu-stone)]/70 pt-6 mt-12">
          <div>{prev && <a href={`/modules/${moduleId}/lessons/${prev.id}`} className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]">← Anterior</a>}</div>
          <a href={`/modules/${moduleId}`} className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]">Voltar ao módulo</a>
          <div>{next && <a href={`/modules/${moduleId}/lessons/${next.id}`} className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]">Próxima →</a>}</div>
        </nav>
      </div>
    </div>
  );
}