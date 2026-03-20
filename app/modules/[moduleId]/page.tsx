import { redirect } from "next/navigation";
import { ReadingLayout } from "@/components/ReadingLayout";
import { MinimalButton } from "@/components/MinimalButton";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";
import { canAccessModuleForUser } from "@/lib/progression";

type Params = { params: { moduleId: string } };

type DbModuleRow = {
  id: string;
  title: string;
  course_id: string;
  order_index: number;
};

type DbLessonRow = {
  id: string;
  title: string;
  order_index: number;
};

type DbLessonCompletionRow = {
  lesson_id: string;
  completed: boolean;
};

type DbProgressRow = {
  completed: boolean;
  quiz_score: number | null;
  assignment_submitted: boolean;
  mentorship_unlocked: boolean;
};

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-[var(--liceu-stone)]/70 pb-2">
      <h2 className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
        {children}
      </h2>
    </div>
  );
}

function CheckRow({
  label,
  checked,
  href,
}: {
  label: string;
  checked: boolean;
  href?: string;
}) {
  const content = (
    <div className="flex items-start justify-between gap-6 py-2">
      <div className="min-w-0">
        <div className="font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-text)]">
          {label}
        </div>
      </div>
      <div
        className={[
          "shrink-0 rounded-full border px-2 py-0.5",
          "font-[var(--font-liceu-mono)] text-[10px] tracking-[0.22em]",
          checked
            ? "border-[var(--liceu-accent)]/45 text-[var(--liceu-accent)]"
            : "border-[var(--liceu-stone)]/80 text-[var(--liceu-muted)]",
        ].join(" ")}
      >
        {checked ? "DONE" : "TODO"}
      </div>
    </div>
  );

  if (!href) return <div className="border-b border-[var(--liceu-stone)]/50">{content}</div>;

  return (
    <a
      href={href}
      className="block border-b border-[var(--liceu-stone)]/50 hover:bg-[var(--liceu-surface)]/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--liceu-accent)]/55"
    >
      {content}
    </a>
  );
}

export default async function ModulePage({ params }: Params) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const supabase = await createSupabaseServerClient();

  const { data: moduleRow } = await supabase
    .from("modules")
    .select("id, title, course_id, order_index")
    .eq("id", params.moduleId)
    .maybeSingle<DbModuleRow>();

  if (!moduleRow) {
    redirect("/dashboard");
  }

  const accessible = await canAccessModuleForUser(user.id, moduleRow.id);
  if (!accessible) {
    redirect("/dashboard");
  }

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, order_index")
    .eq("module_id", moduleRow.id)
    .order("order_index", { ascending: true });

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
    (lessonCompletions ?? [])
      .filter((lc) => lc.completed)
      .map((lc) => lc.lesson_id),
  );

  const { data: progressRow } = await supabase
    .from("module_progress")
    .select("completed, quiz_score, assignment_submitted, mentorship_unlocked")
    .eq("user_id", user.id)
    .eq("module_id", moduleRow.id)
    .maybeSingle<DbProgressRow>();

  const quizPassed = (progressRow?.quiz_score ?? 0) >= 70;
  const assignmentApproved = progressRow?.assignment_submitted ?? false;
  const allLessonsCompleted =
    typedLessons.length > 0 &&
    typedLessons.every((l) => completedLessonIds.has(l.id));

  return (
    <ReadingLayout
      eyebrow={`LICEU UNDERGROUND / MÓDULO ${moduleRow.order_index}`}
      title={moduleRow.title}
      subtitle={
        "Conteúdo, treinamento e produção. Três camadas. Uma disciplina."
      }
      right={
        <div className="w-56 space-y-3 border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/50 px-4 py-3">
          <div className="font-[var(--font-liceu-mono)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
            DESBLOQUEIO
          </div>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-[var(--font-liceu-sans)] text-[var(--liceu-muted)]">
                Lição
              </span>
              <span className="font-[var(--font-liceu-mono)] text-[11px] text-[var(--liceu-text)]">
                {allLessonsCompleted ? "OK" : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-[var(--font-liceu-sans)] text-[var(--liceu-muted)]">
                Quiz
              </span>
              <span className="font-[var(--font-liceu-mono)] text-[11px] text-[var(--liceu-text)]">
                {quizPassed ? "OK" : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-[var(--font-liceu-sans)] text-[var(--liceu-muted)]">
                Produção
              </span>
              <span className="font-[var(--font-liceu-mono)] text-[11px] text-[var(--liceu-text)]">
                {assignmentApproved ? "OK" : "—"}
              </span>
            </div>
          </div>
          <div className="mt-4 border-t border-[var(--liceu-stone)]/60 pt-3">
            <div className="font-[var(--font-liceu-sans)] text-xs text-[var(--liceu-muted)]">
              Mentoria
            </div>
            <div className="mt-1 font-[var(--font-liceu-sans)] text-xs text-[var(--liceu-text)]">
              {progressRow?.mentorship_unlocked ? "Liberada" : "Bloqueada"}
            </div>
          </div>
        </div>
      }
    >
      <div className="space-y-10">
        <section className="space-y-3">
          <SectionTitle>CONTEÚDO</SectionTitle>
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-4 py-1">
            {(lessons ?? []).length === 0 ? (
              <div className="py-3 font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-muted)]">
                Nenhuma lição cadastrada para este módulo.
              </div>
            ) : (
              <div>
                {typedLessons.map((l) => (
                  <CheckRow
                    key={l.id}
                    label={`${l.order_index}. ${l.title}`}
                    checked={completedLessonIds.has(l.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <SectionTitle>TREINAMENTO</SectionTitle>
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-4 py-1">
            <CheckRow
              label="Quiz"
              checked={quizPassed}
              href={`/modules/${moduleRow.id}/quiz`}
            />
            <CheckRow label="Flashcards" checked={false} />
          </div>
          <p className="font-[var(--font-liceu-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
            Tentativas ilimitadas. Nova tentativa exige revisão do módulo (a ser
            automatizado).
          </p>
        </section>

        <section className="space-y-3">
          <SectionTitle>PRODUÇÃO</SectionTitle>
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/40 px-4 py-1">
            <CheckRow
              label="Texto / Exercício retórico"
              checked={assignmentApproved}
              href={`/modules/${moduleRow.id}/assignment`}
            />
            <CheckRow label="Análise de texto clássico" checked={false} />
            <CheckRow label="Micro discurso" checked={false} />
          </div>
        </section>

        <section className="flex items-center justify-between gap-6 border-t border-[var(--liceu-stone)]/70 pt-6">
          <div className="font-[var(--font-liceu-sans)] text-xs text-[var(--liceu-muted)]">
            Ao concluir o módulo, a próxima unidade será liberada, assim como a
            sessão de mentoria.
          </div>
          <form action={`/api/modules/${moduleRow.id}/complete`} method="post">
            <MinimalButton type="submit">Concluir módulo</MinimalButton>
          </form>
        </section>
      </div>
    </ReadingLayout>
  );
}

