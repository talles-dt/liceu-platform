import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";
import { CompleteLessonButton } from "@/components/CompleteLessonButton";

export default async function LessonPage(props: { params: Promise<{ moduleId: string; lessonId: string }> }) {
  const { moduleId, lessonId } = await props.params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();

  const [{ data: lesson }, { data: mod }, { data: theory }] = await Promise.all([
    supabase.from("liceu_lessons").select("id, title, subtitle, learning_objective, order_index, module_id, difficulty_tier, estimated_minutes, rhetorical_dimension").eq("id", lessonId).eq("module_id", moduleId).maybeSingle<{
      id: string;
      title: string;
      subtitle: string | null;
      learning_objective: string | null;
      order_index: number;
      module_id: string;
      difficulty_tier: number | null;
      estimated_minutes: number | null;
      rhetorical_dimension: string | null;
    }>(),
    supabase.from("liceu_modules").select("id, title, order_index").eq("id", moduleId).maybeSingle<{ id: string; title: string; order_index: number }>(),
    supabase.from("liceu_theoretical_content").select("content_markdown, title").eq("lesson_id", lessonId).order("section_order").limit(1).maybeSingle<{ content_markdown?: string | null; title?: string | null }>(),
  ]);

  if (!lesson || !mod) notFound();

  const contentMd = theory?.content_markdown ?? null;
  const contentHtml = contentMd ? await marked(contentMd, { breaks: true }) : null;

  const { data: prog } = await supabase.from("liceu_learner_progression").select("completed_lessons").eq("user_id", user.id).maybeSingle<{ completed_lessons?: string[] }>();
  const completed = ((prog?.completed_lessons ?? []) as string[]).includes(lessonId);

  const { data: allLessons } = await supabase.from("liceu_lessons").select("id, title, order_index").eq("module_id", moduleId).eq("is_published", true).order("order_index");
  const lessons = (allLessons ?? []) as { id: string; title: string; order_index: number }[];
  const idx = lessons.findIndex((l) => l.id === lessonId);
  const prev = idx > 0 ? lessons[idx - 1] : null;
  const next = idx < lessons.length - 1 ? lessons[idx + 1] : null;

  const dimLabel: Record<string, string> = { inventio: "Inventio", dispositio: "Dispositio", elocutio: "Elocutio", memoria: "Memória", pronuntiatio: "Pronuntiatio" };

  return (
    <div className="min-h-screen bg-[var(--liceu-bg)] text-[var(--liceu-text)]">
      <div className="max-w-4xl mx-auto p-8 md:p-16">
        <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] mb-8">
          <a href="/dashboard" className="hover:text-[var(--liceu-text)]">dashboard</a>
          {" / "}
          <a href={`/modules/${moduleId}`} className="hover:text-[var(--liceu-text)]">{mod.title}</a>
          {" / "}
          <span className="text-[var(--liceu-text)]">lição {lesson.order_index + 1}</span>
        </div>

        <header className="mb-12">
          <h1 className="font-[var(--font-noto-serif)] text-3xl md:text-5xl leading-tight text-[var(--liceu-text)]">{lesson.title}</h1>
          {lesson.subtitle && <p className="mt-3 font-[var(--font-noto-serif)] text-xl italic text-[var(--liceu-muted)]">{lesson.subtitle}</p>}
          <div className="mt-4 flex flex-wrap gap-4 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">
            <span>Dificuldade {lesson.difficulty_tier ?? 1}/5</span>
            <span>{lesson.estimated_minutes ?? 0} min</span>
            {lesson.rhetorical_dimension && <span>{dimLabel[lesson.rhetorical_dimension as keyof typeof dimLabel] || lesson.rhetorical_dimension}</span>}
          </div>
        </header>

        <article className="space-y-8">
          {contentHtml ? (
            <section
              className="prose prose-invert prose-lg max-w-none prose-headings:font-[var(--font-noto-serif)] prose-headings:text-[var(--liceu-text)] prose-p:text-[var(--liceu-text)]/90 prose-a:text-[var(--liceu-accent)] prose-blockquote:border-l-[var(--liceu-accent)] prose-blockquote:text-[var(--liceu-muted)] prose-strong:text-[var(--liceu-text)] prose-code:bg-[var(--liceu-surface)] prose-code:px-1 prose-code:rounded prose-pre:bg-[var(--liceu-surface-container)]"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          ) : (
            <div className="border border-[var(--liceu-stone)]/50 p-6 font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-muted)]">
              <p>O conteúdo teórico desta lição está sendo preparado.</p>
              {lesson.learning_objective && <p className="mt-2"><strong>Objetivo:</strong> {lesson.learning_objective}</p>}
            </div>
          )}

          <section className="border-t border-[var(--liceu-stone)]/70 pt-6">
            <CompleteLessonButton moduleId={moduleId} lessonId={lessonId} />
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

