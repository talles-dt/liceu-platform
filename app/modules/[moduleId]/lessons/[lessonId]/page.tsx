import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";
import { canAccessLiceuModuleForUser } from "@/lib/progression";
import { getUserAccessLevel } from "@/lib/access";
import { ReadingLayout } from "@/components/ReadingLayout";
import { LessonQuiz } from "@/components/LessonQuiz";
import { VideoPlayer } from "@/components/VideoPlayer";

type Params = { params: Promise<{ moduleId: string; lessonId: string }> };

type DbLesson = {
  id: string;
  title: string;
  subtitle: string;
  learning_objective: string;
  order_index: number;
  module_id: string;
  difficulty_tier: number;
  estimated_minutes: number;
  rhetorical_dimension: string;
};

type DbModule = {
  id: string;
  title: string;
  order_index: number;
  course_id: string;
};

export default async function LessonPage({ params }: Params) {
  const { moduleId, lessonId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();

  // Check module access using Liceu tables
  const accessible = await canAccessLiceuModuleForUser(user.id, moduleId);
  if (!accessible) redirect("/dashboard");

  // Load lesson + module + theory content using Liceu tables
  const [{ data: lessonData }, { data: moduleData }, { data: theoryData }] = await Promise.all([
    supabase
      .from("liceu_lessons")
      .select("id, title, subtitle, learning_objective, order_index, module_id, difficulty_tier, estimated_minutes, rhetorical_dimension")
      .eq("id", lessonId)
      .eq("module_id", moduleId)
      .maybeSingle<DbLesson>(),
    supabase
      .from("liceu_modules")
      .select("id, title, order_index")
      .eq("id", moduleId)
      .maybeSingle<DbModule>(),
    supabase
      .from("liceu_theoretical_content")
      .select("content_markdown, title")
      .eq("lesson_id", lessonId)
      .order("section_order")
      .limit(1)
      .maybeSingle<{ content_markdown: string; title: string }>(),
  ]);

  if (!lessonData || !moduleData) notFound();

  const hasVideo = false; // No cloudflare_stream_id in Liceu schema
  const contentMarkdown = theoryData?.content_markdown ?? null;

  // Check if already completed using Liceu progression
  const { data: progression } = await supabase
    .from("liceu_learner_progression")
    .select("completed_lessons")
    .eq("user_id", user.id)
    .maybeSingle<{ completed_lessons: string[] }>();

  const alreadyCompleted = (progression?.completed_lessons ?? []).includes(lessonId);

  // Load lesson quiz questions (just count — full load is client-side)
  const { data: quizQuestions } = await supabase
    .from("liceu_exercises")
    .select("id")
    .eq("lesson_id", lessonId)
    .eq("exercise_type", "identification");

  const hasQuiz = (quizQuestions?.length ?? 0) > 0;

  // Render markdown content from theoretical_content table
  const rawHtml = contentMarkdown
    ? await marked(contentMarkdown, { breaks: true })
    : null;
  const contentHtml = rawHtml ? DOMPurify.sanitize(rawHtml) : null;

  // Load all lessons in module for prev/next navigation
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

  const downloadUrl = `/api/lessons/${lessonId}/download`;

  return (
    <ReadingLayout
      eyebrow={`LICEU / MÓDULO ${moduleData.order_index + 1} / LIÇÃO ${lessonData.order_index + 1}`}
      title={lessonData.title}
      subtitle={moduleData.title}
      right={
        <div className="w-48 space-y-3">
          {/* Completion status */}
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/50 px-4 py-3">
            <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Status
            </div>
            <div className={[
              "mt-1 font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.18em]",
              alreadyCompleted ? "text-[var(--liceu-accent)]" : "text-[var(--liceu-muted)]",
            ].join(" ")}>
              {alreadyCompleted ? "Concluída" : "Em progresso"}
            </div>
          </div>

          {/* Download */}
          <a
            href={downloadUrl}
            className="block border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/50 px-4 py-3 hover:bg-[var(--liceu-surface)]/70 transition-colors"
          >
            <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Baixar capítulo
            </div>
            <div className="mt-1 font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-text)]">
              PDF para leitura offline
            </div>
          </a>
        </div>
      }
    >
      <div className="space-y-12">

        {/* Video — only for video/mentoring purchasers */}
        {hasVideo && (
          <section className="space-y-3">
            <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Aula em vídeo
            </div>
            <VideoPlayer lessonId={lessonId} />
          </section>
        )}

        {/* Text content */}
        {contentHtml ? (
          <section className="space-y-3">
            <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Leitura
            </div>
            <article
              className="prose-liceu"
              dangerouslySetInnerHTML={{ __html: contentHtml }}
            />
          </section>
        ) : (
          <p className="font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-muted)]">
            Conteúdo desta lição ainda não disponível.
          </p>
        )}

        {/* Lesson quiz — completion trigger */}
        {hasQuiz && (
          <section className="space-y-3 border-t border-[var(--liceu-stone)]/70 pt-10">
            <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              Verificação
            </div>
            <p className="font-[var(--font-liceu-sans)] text-[12px] text-[var(--liceu-muted)]">
              Responda as perguntas abaixo para concluir esta lição. Mínimo 70%.
            </p>
            <LessonQuiz
              lessonId={lessonId}
              alreadyCompleted={alreadyCompleted}
            />
          </section>
        )}

        {!hasQuiz && !alreadyCompleted && contentHtml && (
          <section className="border-t border-[var(--liceu-stone)]/70 pt-6">
            <MarkCompleteButton lessonId={lessonId} />
          </section>
        )}

        {/* Navigation */}
        <nav className="flex items-center justify-between border-t border-[var(--liceu-stone)]/70 pt-6">
          <div>
            {prevLesson && (
              <a
                href={`/modules/${moduleId}/lessons/${prevLesson.id}` as string}
                className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]"
              >
                ← Anterior
              </a>
            )}
          </div>
          <a
            href={`/modules/${moduleId}` as string}
            className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]"
          >
            Voltar ao módulo
          </a>
          <div>
            {nextLesson && (
              <a
                href={`/modules/${moduleId}/lessons/${nextLesson.id}` as string}
                className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]"
              >
                Próxima →
              </a>
            )}
          </div>
        </nav>

      </div>
    </ReadingLayout>
  );
}

// Simple server-action-style button for lessons with no quiz
function MarkCompleteButton({ lessonId }: { lessonId: string }) {
  return (
    <form action={`/api/lessons/${lessonId}/quiz`} method="post">
      <input type="hidden" name="answers" value="{}" />
      <button
        type="submit"
        className="border border-[var(--liceu-stone)] px-4 py-2 font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]"
      >
        Marcar como concluída
      </button>
    </form>
  );
}
