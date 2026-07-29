import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";

type Params = { params: Promise<{ moduleId: string; lessonId: string }> };

export default async function LessonPage({ params }: Params) {
  const { moduleId, lessonId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();

  // Load lesson
  const { data: lessonData } = await supabase
    .from("liceu_lessons")
    .select("id, title, subtitle, learning_objective, order_index, module_id, difficulty_tier, estimated_minutes, rhetorical_dimension")
    .eq("id", lessonId)
    .eq("module_id", moduleId)
    .maybeSingle();

  if (!lessonData) notFound();

  // Load module
  const { data: moduleData } = await supabase
    .from("liceu_modules")
    .select("id, title, order_index")
    .eq("id", moduleId)
    .maybeSingle();

  if (!moduleData) notFound();

  // Load theory content
  const { data: theory } = await supabase
    .from("liceu_theoretical_content")
    .select("content_markdown, title")
    .eq("lesson_id", lessonId)
    .order("section_order")
    .limit(1)
    .maybeSingle();

  const contentMarkdown = theory?.content_markdown ?? null;

  // Check if completed
  const { data: prog } = await supabase
    .from("liceu_learner_progression")
    .select("completed_lessons")
    .eq("user_id", user.id)
    .maybeSingle();

  const alreadyCompleted = ((prog as { completed_lessons?: string[] } | null)?.completed_lessons ?? []).includes(lessonId);

  // Load quiz questions count
  const { data: quizQuestions } = await supabase
    .from("liceu_exercises")
    .select("id")
    .eq("lesson_id", lessonId)
    .eq("exercise_type", "identification");

  const hasQuiz = (quizQuestions?.length ?? 0) > 0;

  // Render markdown
  const rawHtml = contentMarkdown ? await marked(contentMarkdown, { breaks: true }) : null;
  const contentHtml = rawHtml ? DOMPurify.sanitize(rawHtml) : null;

  // Load all lessons for prev/next nav
  const { data: allLessons } = await supabase
    .from("liceu_lessons")
    .select("id, title, order_index")
    .eq("module_id", moduleId)
    .eq("is_published", true)
    .order("order_index");

  const lessons = (allLessons ?? []) as { id: string; title: string; order_index: number }[];
  const currentIdx = lessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? lessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null;

  return (
    <div className="min-h-screen bg-[var(--liceu-bg)] text-[var(--liceu-text)]">
      <div className="max-w-4xl mx-auto p-8 md:p-16">
        {/* Breadcrumb */}
        <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] mb-8">
          <a href="/dashboard" className="hover:text-[var(--liceu-text)]">dashboard</a>
          {" / "}
          <a href={`/modules/${moduleId}`} className="hover:text-[var(--liceu-text)]">
            {moduleData.title}
          </a>
          {" / "}
          <span className="text-[var(--liceu-text)]">lição {lessonData.order_index + 1}</span>
        </div>

        {/* Header */}
        <header className="mb-12">
          <h1 className="font-[var(--font-noto-serif)] text-3xl md:text-5xl leading-tight">
            {lessonData.title}
          </h1>
          {lessonData.subtitle && (
            <p className="mt-3 font-[var(--font-noto-serif)] text-xl italic text-[var(--liceu-muted)]">
              {lessonData.subtitle}
            </p>
          )}
          <div className="mt-4 flex gap-4 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">
            <span>Dificuldade {lessonData.difficulty_tier}/5</span>
            <span>{lessonData.estimated_minutes} min</span>
            {lessonData.rhetorical_dimension && (
              <span>{lessonData.rhetorical_dimension}</span>
            )}
          </div>
        </header>

        {/* Content */}
        <article className="space-y-8">
          {contentHtml ? (
            <section
              className="prose-liceu"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          ) : (
            <div className="border border-[var(--liceu-stone)]/50 p-6 font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-muted)]">
              <p>
                O conteúdo teórico desta lição está sendo preparado.
                {lessonData.learning_objective && (
                  <span className="block mt-2">
                    <strong>Objetivo:</strong> {lessonData.learning_objective}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Completion */}
          <section className="border-t border-[var(--liceu-stone)]/70 pt-6">
            {alreadyCompleted ? (
              <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-accent)]">
                ✓ Lição concluída
              </div>
            ) : (
              <form action={`/api/lessons/${lessonId}/quiz`} method="post">
                <input type="hidden" name="answers" value="{}" />
                <button
                  type="submit"
                  className="border border-[var(--liceu-stone)] px-4 py-2 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] hover:border-[var(--liceu-accent)] transition-colors"
                >
                  Marcar como concluída
                </button>
              </form>
            )}
          </section>
        </article>

        {/* Navigation */}
        <nav className="flex items-center justify-between border-t border-[var(--liceu-stone)]/70 pt-6 mt-12">
          <div>
            {prevLesson && (
              <a
                href={`/modules/${moduleId}/lessons/${prevLesson.id}`}
                className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]"
              >
                ← Anterior
              </a>
            )}
          </div>
          <a
            href={`/modules/${moduleId}`}
            className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]"
          >
            Voltar ao módulo
          </a>
          <div>
            {nextLesson && (
              <a
                href={`/modules/${moduleId}/lessons/${nextLesson.id}`}
                className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]"
              >
                Próxima →
              </a>
            )}
          </div>
        </nav>
      </div>
    </div>
  );
}