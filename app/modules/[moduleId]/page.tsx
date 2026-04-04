import { redirect } from "next/navigation";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";
import { canAccessModuleForUser } from "@/lib/progression";
import { ModuleStartTracker } from "@/components/ModuleStartTracker";

export const revalidate = 60;

type Params = { params: Promise<{ moduleId: string }> };

type DbModuleRow = { id: string; title: string; course_id: string; order_index: number };
type DbLessonRow = { id: string; title: string; order_index: number };
type DbLessonCompletionRow = { lesson_id: string; completed: boolean };
type DbProgressRow = {
  completed: boolean;
  quiz_score: number | null;
  assignment_submitted: boolean;
  mentorship_unlocked: boolean;
};
type DbSubmissionRow = { kind: string; status: string };

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-[var(--liceu-stone)]/70 pb-2">
      <h2 className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
        {children}
      </h2>
    </div>
  );
}

function CheckRow({
  label,
  checked,
  optional,
  href,
}: {
  label: string;
  checked: boolean;
  optional?: boolean;
  href?: string;
}) {
  const badge = checked ? "DONE" : optional ? "OPCIONAL" : "TODO";
  const badgeClass = checked
    ? "border-[var(--liceu-secondary)]/45 text-[var(--liceu-secondary)]"
    : optional
      ? "border-[var(--liceu-stone)]/50 text-[var(--liceu-muted)]/60"
      : "border-[var(--liceu-stone)]/80 text-[var(--liceu-muted)]";

  const content = (
    <div className="flex items-start justify-between gap-6 py-2">
      <div className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)]">
        {label}
      </div>
      <div
        className={[
          "shrink-0 rounded-full border px-2 py-0.5",
          "font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em]",
          badgeClass,
        ].join(" ")}
      >
        {badge}
      </div>
    </div>
  );

  if (!href)
    return <div className="border-b border-[var(--liceu-stone)]/50">{content}</div>;

  return (
    <a
      href={href}
      className="block border-b border-[var(--liceu-stone)]/50 hover:bg-[var(--liceu-surface)]/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--liceu-secondary)]/55"
    >
      {content}
    </a>
  );
}

export default async function ModulePage({ params }: Params) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { moduleId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: moduleRow } = await supabase
    .from("modules")
    .select("id, title, course_id, order_index")
    .eq("id", moduleId)
    .maybeSingle<DbModuleRow>();

  if (!moduleRow) redirect("/dashboard");

  const accessible = await canAccessModuleForUser(user.id, moduleRow.id);
  if (!accessible) redirect("/dashboard");

  // Parallelise all independent DB reads
  const [
    { data: lessons },
    { data: progressRow },
    { data: submissions },
    { data: hasText },
  ] = await Promise.all([
    supabase
      .from("lessons")
      .select("id, title, order_index")
      .eq("module_id", moduleRow.id)
      .order("order_index", { ascending: true }),
    supabase
      .from("module_progress")
      .select("completed, quiz_score, assignment_submitted, mentorship_unlocked")
      .eq("user_id", user.id)
      .eq("module_id", moduleRow.id)
      .maybeSingle<DbProgressRow>(),
    supabase
      .from("assignment_submissions")
      .select("kind, status")
      .eq("user_id", user.id)
      .eq("module_id", moduleRow.id),
    supabase
      .from("module_texts")
      .select("id")
      .eq("module_id", moduleRow.id)
      .maybeSingle(),
  ]);

  const typedLessons = (lessons ?? []) as DbLessonRow[];
  const lessonIds = typedLessons.map((l) => l.id);

  const { data: lessonCompletions } = lessonIds.length
    ? await supabase
        .from("lesson_completions")
        .select("lesson_id, completed")
        .eq("user_id", user.id)
        .in("lesson_id", lessonIds)
    : { data: [] as DbLessonCompletionRow[] };

  const completedLessonIds = new Set(
    ((lessonCompletions ?? []) as DbLessonCompletionRow[])
      .filter((lc) => lc.completed)
      .map((lc) => lc.lesson_id),
  );

  const typedSubmissions = (submissions ?? []) as DbSubmissionRow[];

  const submissionStatus = (kind: string) => {
    const s = typedSubmissions.find((s) => s.kind === kind);
    return s?.status ?? null;
  };

  const quizPassed = (progressRow?.quiz_score ?? 0) >= 70;
  const assignmentApproved = progressRow?.assignment_submitted ?? false;
  const allLessonsCompleted =
    typedLessons.length > 0 && typedLessons.every((l) => completedLessonIds.has(l.id));

  const speechStatus = submissionStatus("micro_speech");
  const analysisStatus = submissionStatus("text_analysis");

  const speechDone = speechStatus === "approved" || speechStatus === "pending";
  const analysisDone = analysisStatus === "approved" || analysisStatus === "pending";
  const hasTextForModule = !!hasText;

  return (
    <ReadingLayout
      eyebrow={`LICEU UNDERGROUND / MÓDULO ${moduleRow.order_index}`}
      title={moduleRow.title}
      subtitle="Conteúdo, treinamento e produção. Três camadas. Uma disciplina."
      right={
        <div className="w-56 space-y-3 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/50 px-4 py-3">
          <div className="font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
            DESBLOQUEIO
          </div>
          <div className="mt-2 space-y-2">
            {[
              { label: "Lições", ok: allLessonsCompleted },
              { label: "Quiz ≥ 70%", ok: quizPassed },
              { label: "Produção aprovada", ok: assignmentApproved },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center justify-between text-xs">
                <span className="font-[var(--font-work-sans)] text-[var(--liceu-muted)]">
                  {label}
                </span>
                <span className="font-[var(--font-space-grotesk)] text-[11px] text-[var(--liceu-text)]">
                  {ok ? "OK" : "—"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-[var(--liceu-stone)]/60 pt-3">
            <div className="font-[var(--font-work-sans)] text-xs text-[var(--liceu-muted)]">
              Mentoria
            </div>
            <div className="mt-1 font-[var(--font-work-sans)] text-xs text-[var(--liceu-text)]">
              {progressRow?.mentorship_unlocked ? "Liberada" : "Bloqueada"}
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-10">
        <ModuleStartTracker moduleId={moduleRow.id} />
        {/* CONTENT */}
        <section className="space-y-3">
          <SectionTitle>CONTEÚDO</SectionTitle>
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-4 py-1">
            {typedLessons.length === 0 ? (
              <div className="py-3 font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)]">
                Nenhuma lição cadastrada.
              </div>
            ) : (
              typedLessons.map((l) => (
                <CheckRow
                  key={l.id}
                  label={`${l.order_index + 1}. ${l.title}`}
                  checked={completedLessonIds.has(l.id)}
                  href={`/modules/${moduleRow.id}/lessons/${l.id}`}
                />
              ))
            )}
          </div>
        </section>

        {/* TRAINING */}
        <section className="space-y-3">
          <SectionTitle>TREINAMENTO</SectionTitle>
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-4 py-1">
            <CheckRow
              label="Quiz"
              checked={quizPassed}
              href={`/modules/${moduleRow.id}/quiz`}
            />
            <CheckRow
              label="Flashcards"
              checked={false}
              optional
              href={`/modules/${moduleRow.id}/flashcards`}
            />
          </div>
          <p className="font-[var(--font-work-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
            Flashcards: repetição espaçada (SM-2). Não obrigatório para avançar.
          </p>
        </section>

        {/* PRODUCTION */}
        <section className="space-y-3">
          <SectionTitle>PRODUÇÃO</SectionTitle>
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-4 py-1">
            <CheckRow
              label="Exercício retórico principal"
              checked={assignmentApproved}
              href={`/modules/${moduleRow.id}/assignment`}
            />
            {hasTextForModule && (
              <CheckRow
                label="Análise de texto clássico"
                checked={analysisDone}
                optional
                href={`/modules/${moduleRow.id}/analysis`}
              />
            )}
            <CheckRow
              label="Micro discurso"
              checked={speechDone}
              optional
              href={`/modules/${moduleRow.id}/speech`}
            />
          </div>
          <p className="font-[var(--font-work-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
            Análise e micro discurso não bloqueiam avanço. Revisão humana.
          </p>
        </section>

        {/* COMPLETE */}
        <section className="flex items-center justify-between gap-6 border-t border-[var(--liceu-stone)]/70 pt-6">
          <div className="font-[var(--font-work-sans)] text-xs text-[var(--liceu-muted)]">
            Ao concluir o módulo, a próxima unidade e a sessão de mentoria são liberadas.
          </div>
          <form action={`/api/modules/${moduleRow.id}/complete`} method="post">
            <MinimalButton type="submit">Concluir módulo</MinimalButton>
          </form>
        </section>
      </div>
    </ReadingLayout>
  );
}
