import { redirect } from "next/navigation";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";
import { canAccessModuleForUser } from "@/lib/progression";
import { ModuleStartTracker } from "@/components/ModuleStartTracker";
import Link from "next/link";

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

/* ── Mini bar-chart for the sidebar progress module ── */
function MiniBarChart({ lessonCount, completedCount }: { lessonCount: number; completedCount: number }) {
  const bars = 7;
  const items = Array.from({ length: bars }, (_, i) => {
    const done = i < completedCount;
    const total = i < lessonCount;
    const h = total ? Math.max(20, Math.round((done ? 1 : 0.35) * 100)) : 12;
    return { i, h, done, total };
  });

  return (
    <div className="flex items-end gap-1 h-12">
      {items.map(({ i, h, done, total }) => (
        <div
          key={i}
          className={`w-2 ${done ? "bg-[var(--liceu-secondary)]" : total ? "bg-[var(--liceu-accent)]/40" : "bg-[var(--liceu-stone)]/40"}`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

/* ── Protocol card for the Master's Notes sidebar ── */
function ProtocolCard({ label, icon, title, description }: { label: string; icon: string; title: string; description: string }) {
  return (
    <div className="group bg-surface-container-low p-4 hover:bg-surface-container-high transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em] text-[var(--liceu-secondary)]">
          {label}
        </span>
        <span className="text-sm">{icon}</span>
      </div>
      <h4 className="font-[var(--font-noto-serif)] text-base text-[var(--liceu-text)] group-hover:text-[var(--liceu-accent)] transition-colors">
        {title}
      </h4>
      <p className="mt-1 font-[var(--font-work-sans)] text-xs text-[var(--liceu-muted)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}

/* ── Status badge for module cards ── */
function StatusBadge({ status }: { status: "completed" | "current" | "locked" }) {
  const config = {
    completed: { text: "COMPLETED", color: "text-[var(--liceu-secondary)]" },
    current: { text: "IN PROGRESS", color: "text-[var(--liceu-accent)]" },
    locked: { text: "LOCKED", color: "text-[var(--liceu-stone)]" },
  };
  const { text, color } = config[status];
  return (
    <span className={`font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em] ${color}`}>
      {text}
    </span>
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
    // Fetch sibling modules for navigation and grid
    { data: siblingModules },
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
    supabase
      .from("modules")
      .select("id, title, course_id, order_index")
      .eq("course_id", moduleRow.course_id)
      .order("order_index", { ascending: true }),
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

  const allModules = (siblingModules ?? []) as DbModuleRow[];
  const currentIndex = allModules.findIndex((m) => m.id === moduleRow.id);
  const prevModule = currentIndex > 0 ? allModules[currentIndex - 1] : null;
  const nextModule = currentIndex < allModules.length - 1 ? allModules[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-[var(--liceu-bg)] text-[var(--liceu-text)]">
      <ModuleStartTracker moduleId={moduleRow.id} />

      {/* ═══════════════════════════════════════════════
          TWO-COLUMN LAYOUT
          ═══════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row">

        {/* ── READING AREA ── */}
        <div className="flex-1 p-8 md:p-16 max-w-4xl mx-auto">

          {/* Module Header */}
          <header className="mb-16">
            <div className="font-[var(--font-space-grotesk)] text-[var(--liceu-secondary)] tracking-[0.3em] text-sm uppercase">
              M{String(moduleRow.order_index + 1).padStart(2, "0")} / LICEU UNDERGROUND
            </div>
            <h1 className="text-5xl md:text-7xl font-[var(--font-noto-serif)] uppercase mt-6 leading-[1.1]">
              {moduleRow.title}
            </h1>
            <div className="w-24 h-1 bg-[var(--liceu-primary)] mt-8" />
          </header>

          {/* ── Article Content ── */}
          <article className="font-[var(--font-noto-serif)] text-xl leading-relaxed space-y-8">

            {/* Content Section: Lessons */}
            <section>
              <p className="first-letter:text-7xl first-letter:font-bold first-letter:mr-3 first-letter:float-left first-letter:text-[var(--liceu-accent)]">
                Bem-vindo ao m\u00f3dulo {moduleRow.order_index + 1}. Este m\u00f3dulo cont\u00e9m{" "}
                <span className="text-[var(--liceu-accent)] border-b border-[var(--liceu-accent)]/30">
                  {typedLessons.length} li\u00e7\u00f5es
                </span>{" "}
                que cobrem os fundamentos essenciais. Cada li\u00e7\u00e3o foi projetada para construir
                sobre a anterior, formando uma cadeia de conhecimento s\u00f3lida e progressiva.
              </p>

              <blockquote className="border-l-4 border-[var(--liceu-secondary)] bg-surface-container-low p-8 italic text-2xl mt-12 mb-12 font-[var(--font-noto-serif)]">
                &ldquo;A repeti\u00e7\u00e3o \u00e9 a m\u00e3e do aprendizado. A pr\u00e1tica, seu pai.&rdquo;
              </blockquote>
            </section>

            {/* Lessons List */}
            <section className="space-y-2 mt-12">
              <h2 className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] border-b border-[var(--liceu-stone)]/70 pb-2 mb-6">
                LI\u00c7\u00d5ES
              </h2>
              {typedLessons.length === 0 ? (
                <div className="py-3 font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)]">
                  Nenhuma li\u00e7\u00e3o cadastrada.
                </div>
              ) : (
                typedLessons.map((l) => {
                  const done = completedLessonIds.has(l.id);
                  return (
                    <Link
                      key={l.id}
                      href={`/modules/${moduleRow.id}/lessons/${l.id}`}
                      className="group flex items-start justify-between gap-6 py-3 border-b border-[var(--liceu-stone)]/50 hover:bg-[var(--liceu-surface)]/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--liceu-secondary)]/55 px-2 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <span className={`shrink-0 w-2 h-2 ${done ? "bg-[var(--liceu-secondary)]" : "bg-[var(--liceu-stone)]"}`} />
                        <span className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)] group-hover:text-[var(--liceu-accent)] transition-colors">
                          {l.order_index + 1}. {l.title}
                        </span>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em] ${done ? "border-[var(--liceu-secondary)]/45 text-[var(--liceu-secondary)]" : "border-[var(--liceu-stone)]/80 text-[var(--liceu-muted)]"}`}>
                        {done ? "DONE" : "TODO"}
                      </span>
                    </Link>
                  );
                })
              )}
            </section>

            {/* Training Section */}
            <section className="space-y-2 mt-12">
              <h2 className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] border-b border-[var(--liceu-stone)]/70 pb-2 mb-6">
                TREINAMENTO
              </h2>
              <div className="space-y-1">
                <Link
                  href={`/modules/${moduleRow.id}/quiz`}
                  className="group flex items-start justify-between gap-6 py-3 border-b border-[var(--liceu-stone)]/50 hover:bg-[var(--liceu-surface)]/40 px-2 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className={`shrink-0 w-2 h-2 ${quizPassed ? "bg-[var(--liceu-secondary)]" : "bg-[var(--liceu-stone)]"}`} />
                    <span className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)] group-hover:text-[var(--liceu-accent)] transition-colors">
                      Quiz
                    </span>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em] ${quizPassed ? "border-[var(--liceu-secondary)]/45 text-[var(--liceu-secondary)]" : "border-[var(--liceu-stone)]/80 text-[var(--liceu-muted)]"}`}>
                    {quizPassed ? "PASSOU" : "TODO"}
                  </span>
                </Link>
                <Link
                  href={`/modules/${moduleRow.id}/flashcards`}
                  className="group flex items-start justify-between gap-6 py-3 border-b border-[var(--liceu-stone)]/50 hover:bg-[var(--liceu-surface)]/40 px-2 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="shrink-0 w-2 h-2 bg-[var(--liceu-stone)]" />
                    <span className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)] group-hover:text-[var(--liceu-accent)] transition-colors">
                      Flashcards
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full border px-2 py-0.5 font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em] border-[var(--liceu-stone)]/50 text-[var(--liceu-muted)]/60">
                    OPCIONAL
                  </span>
                </Link>
              </div>
              <p className="font-[var(--font-work-sans)] text-xs leading-relaxed text-[var(--liceu-muted)] mt-4">
                Flashcards: repeti\u00e7\u00e3o espa\u00e7ada (SM-2). N\u00e3o obrigat\u00f3rio para avan\u00e7ar.
              </p>
            </section>

            {/* Production Section */}
            <section className="space-y-2 mt-12">
              <h2 className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] border-b border-[var(--liceu-stone)]/70 pb-2 mb-6">
                PRODU\u00c7\u00c3O
              </h2>
              <div className="space-y-1">
                <Link
                  href={`/modules/${moduleRow.id}/assignment`}
                  className="group flex items-start justify-between gap-6 py-3 border-b border-[var(--liceu-stone)]/50 hover:bg-[var(--liceu-surface)]/40 px-2 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className={`shrink-0 w-2 h-2 ${assignmentApproved ? "bg-[var(--liceu-secondary)]" : "bg-[var(--liceu-stone)]"}`} />
                    <span className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)] group-hover:text-[var(--liceu-accent)] transition-colors">
                      Exerc\u00edcio ret\u00f3rico principal
                    </span>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em] ${assignmentApproved ? "border-[var(--liceu-secondary)]/45 text-[var(--liceu-secondary)]" : "border-[var(--liceu-stone)]/80 text-[var(--liceu-muted)]"}`}>
                    {assignmentApproved ? "APROVADO" : "TODO"}
                  </span>
                </Link>
                {hasTextForModule && (
                  <Link
                    href={`/modules/${moduleRow.id}/analysis`}
                    className="group flex items-start justify-between gap-6 py-3 border-b border-[var(--liceu-stone)]/50 hover:bg-[var(--liceu-surface)]/40 px-2 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`shrink-0 w-2 h-2 ${analysisDone ? "bg-[var(--liceu-secondary)]" : "bg-[var(--liceu-stone)]"}`} />
                      <span className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)] group-hover:text-[var(--liceu-accent)] transition-colors">
                        An\u00e1lise de texto cl\u00e1ssico
                      </span>
                    </div>
                    <span className="shrink-0 rounded-full border px-2 py-0.5 font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em] border-[var(--liceu-stone)]/50 text-[var(--liceu-muted)]/60">
                      OPCIONAL
                    </span>
                  </Link>
                )}
                <Link
                  href={`/modules/${moduleRow.id}/speech`}
                  className="group flex items-start justify-between gap-6 py-3 border-b border-[var(--liceu-stone)]/50 hover:bg-[var(--liceu-surface)]/40 px-2 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className={`shrink-0 w-2 h-2 ${speechDone ? "bg-[var(--liceu-secondary)]" : "bg-[var(--liceu-stone)]"}`} />
                    <span className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-text)] group-hover:text-[var(--liceu-accent)] transition-colors">
                      Micro discurso
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full border px-2 py-0.5 font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em] border-[var(--liceu-stone)]/50 text-[var(--liceu-muted)]/60">
                    OPCIONAL
                  </span>
                </Link>
              </div>
              <p className="font-[var(--font-work-sans)] text-xs leading-relaxed text-[var(--liceu-muted)] mt-4">
                An\u00e1lise e micro discurso n\u00e3o bloqueiam avan\u00e7o. Revis\u00e3o humana.
              </p>
            </section>

            {/* Complete Module Action */}
            <section className="flex items-center justify-between gap-6 border-t border-[var(--liceu-stone)]/70 pt-6 mt-12">
              <div className="font-[var(--font-work-sans)] text-xs text-[var(--liceu-muted)]">
                Ao concluir o m\u00f3dulo, a pr\u00f3xima unidade e a sess\u00e3o de mentoria s\u00e3o liberadas.
              </div>
              <form action={`/api/modules/${moduleRow.id}/complete`} method="post">
                <button
                  type="submit"
                  className="font-[var(--font-space-grotesk)] text-[11px] tracking-[0.22em] uppercase border border-[var(--liceu-secondary)] text-[var(--liceu-secondary)] px-6 py-2 hover:bg-[var(--liceu-secondary)]/10 transition-colors"
                >
                  Concluir m\u00f3dulo
                </button>
              </form>
            </section>
          </article>
        </div>

        {/* ── MASTER'S NOTES SIDEBAR ── */}
        <aside className="w-80 bg-surface-container-lowest p-8 border-l border-[var(--liceu-stone)]/10 hidden md:block">
          <div className="sticky top-28">
            {/* Sidebar Header */}
            <div className="text-[var(--liceu-secondary)] border-b border-[var(--liceu-secondary)]/20 pb-4 mb-8">
              <h3 className="font-[var(--font-space-grotesk)] text-[11px] tracking-[0.3em] uppercase">
                MASTER&apos;S_NOTES.TXT
              </h3>
            </div>

            {/* Protocol Cards */}
            <div className="space-y-4 mb-8">
              <ProtocolCard
                label="PROTOCOL_01"
                icon="&#x27E1;"
                title="Leitura Ativa"
                description="Leia cada li\u00e7\u00e3o com aten\u00e7\u00e3o. Marque como conclu\u00edda ao finalizar."
              />
              <ProtocolCard
                label="PROTOCOL_02"
                icon="&#x26A1;"
                title="Quiz de Valida\u00e7\u00e3o"
                description="Atingir \u2265 70% para liberar a pr\u00f3xima etapa."
              />
              <ProtocolCard
                label="PROTOCOL_03"
                icon="&#x2712;"
                title="Produ\u00e7\u00e3o Escrita"
                description="Submeta seu exerc\u00edcio para revis\u00e3o humana. Aguarde aprova\u00e7\u00e3o."
              />
            </div>

            {/* Progress Module */}
            <div className="bg-surface-container p-6 border-l-4 border-[var(--liceu-secondary)]">
              <div className="font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)] mb-4">
                PROGRESS\u00c3O DO M\u00d3DULO
              </div>

              <MiniBarChart lessonCount={typedLessons.length} completedCount={completedLessonIds.size} />

              <div className="mt-4 font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
                {completedLessonIds.size} / {typedLessons.length} SYNC
              </div>

              {/* Unlock Criteria */}
              <div className="mt-6 space-y-3 border-t border-[var(--liceu-stone)]/30 pt-4">
                <div className="font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)] mb-2">
                  DESBLOQUEIO
                </div>
                {[
                  { label: "Li\u00e7\u00f5es", ok: allLessonsCompleted },
                  { label: "Quiz \u2265 70%", ok: quizPassed },
                  { label: "Produ\u00e7\u00e3o aprovada", ok: assignmentApproved },
                ].map(({ label, ok }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="font-[var(--font-work-sans)] text-xs text-[var(--liceu-muted)]">
                      {label}
                    </span>
                    <span className={`font-[var(--font-space-grotesk)] text-[11px] ${ok ? "text-[var(--liceu-secondary)]" : "text-[var(--liceu-muted)]"}`}>
                      {ok ? "OK" : "\u2014"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Mentorship */}
              <div className="mt-6 border-t border-[var(--liceu-stone)]/30 pt-4">
                <div className="font-[var(--font-work-sans)] text-xs text-[var(--liceu-muted)]">
                  Mentoria
                </div>
                <div className="mt-1 font-[var(--font-work-sans)] text-xs text-[var(--liceu-text)]">
                  {progressRow?.mentorship_unlocked ? "Liberada" : "Bloqueada"}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ═══════════════════════════════════════════════
          MODULE PROGRESS GRID
          ═══════════════════════════════════════════════ */}
      {allModules.length > 0 && (
        <section className="px-8 md:px-16 max-w-4xl mx-auto mt-16 mb-12">
          <h2 className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)] border-b border-[var(--liceu-stone)]/70 pb-2 mb-8">
            MAPA DO CURSO
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allModules.map((m) => {
              const isCurrent = m.id === moduleRow.id;
              const isBefore = allModules.indexOf(m) < currentIndex;
              // Determine status: completed if all lessons done, current if this module, locked otherwise
              let status: "completed" | "current" | "locked" = "locked";
              if (isCurrent) {
                status = "current";
              } else if (isBefore) {
                // Simplified: modules before current are considered completed
                status = "completed";
              }

              const borderClass =
                status === "completed"
                  ? "border-l-4 border-[var(--liceu-secondary)]"
                  : status === "current"
                    ? "border-l-4 border-[var(--liceu-accent)] bg-surface-container"
                    : "border-l-4 border-[var(--liceu-stone)] opacity-60";

              return (
                <Link
                  key={m.id}
                  href={status === "locked" ? "#" : `/modules/${m.id}`}
                  className={`${borderClass} p-6 group ${status === "locked" ? "pointer-events-none" : "hover:bg-surface-container-high"} transition-colors`}
                >
                  <StatusBadge status={status} />
                  <h4 className="mt-3 font-[var(--font-noto-serif)] text-lg text-[var(--liceu-text)] group-hover:text-[var(--liceu-accent)] transition-colors">
                    {m.title}
                  </h4>
                  <div className="mt-2 font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
                    M{String(m.order_index + 1).padStart(2, "0")}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════
          NAVIGATION (PREV / NEXT)
          ═══════════════════════════════════════════════ */}
      {(prevModule || nextModule) && (
        <nav className="px-8 md:px-16 max-w-4xl mx-auto border-t border-[var(--liceu-stone)]/70 py-8 flex justify-between">
          {prevModule ? (
            <Link
              href={`/modules/${prevModule.id}`}
              className="font-[var(--font-space-grotesk)] text-xs tracking-[0.15em] uppercase text-[var(--liceu-muted)] hover:text-[var(--liceu-accent)] transition"
            >
              {"\u2190"} M{String(prevModule.order_index + 1).padStart(2, "0")} {prevModule.title}
            </Link>
          ) : (
            <div />
          )}
          {nextModule ? (
            <Link
              href={`/modules/${nextModule.id}`}
              className="font-[var(--font-space-grotesk)] text-xs tracking-[0.15em] uppercase text-[var(--liceu-muted)] hover:text-[var(--liceu-accent)] transition"
            >
              M{String(nextModule.order_index + 1).padStart(2, "0")} {nextModule.title} {"\u2192"}
            </Link>
          ) : (
            <div />
          )}
        </nav>
      )}
    </div>
  );
}
