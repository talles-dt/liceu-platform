import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { Course, Module, ModuleProgress } from "@/lib/domain";
import { canAccessModule } from "@/lib/domain";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";
import { ReadingLayout } from "@/components/ReadingLayout";
import { ModuleList, type ModuleListItem } from "@/components/ModuleList";
import { getCommerceConfig } from "@/lib/commerce";
import { PurchaseToast } from "@/components/PurchaseToast";

type DbCourseRow = {
  id: string;
  title: string;
};

type DbModuleRow = {
  id: string;
  course_id: string;
  order_index: number;
  title: string;
};

type DbModuleProgressRow = {
  module_id: string;
  completed: boolean;
  quiz_score: number | null;
  assignment_submitted: boolean;
  mentorship_unlocked: boolean;
};

async function loadDashboardData(userId: string) {
  const supabase = await createSupabaseServerClient();

  // Load progress first — this is the source of truth for which courses
  // the user has purchased (provisioning creates rows on purchase).
  const { data: progressData } = await supabase
    .from("module_progress")
    .select(
      "module_id, completed, quiz_score, assignment_submitted, mentorship_unlocked",
    )
    .eq("user_id", userId);

  const progress: ModuleProgress[] =
    progressData?.map((p: DbModuleProgressRow) => ({
      moduleId: p.module_id,
      completed: p.completed,
      quizScore: p.quiz_score,
      assignmentApproved: p.assignment_submitted,
      mentorshipUnlocked: p.mentorship_unlocked,
    })) ?? [];

  if (progress.length === 0) {
    return { courses: [], progress };
  }

  const purchasedModuleIds = progress.map((p) => p.moduleId);

  // Load only the modules the user has progress rows for (i.e. purchased).
  const { data: modulesData } = await supabase
    .from("modules")
    .select("id, course_id, order_index, title")
    .in("id", purchasedModuleIds)
    .order("course_id")
    .order("order_index", { ascending: true });

  const modules: Module[] =
    modulesData?.map((m: DbModuleRow) => ({
      id: m.id,
      courseId: m.course_id,
      index: m.order_index,
      title: m.title,
    })) ?? [];

  // Collect the unique course IDs the user has access to.
  const purchasedCourseIds = [...new Set(modules.map((m) => m.courseId))];

  // Load course titles from the courses table.
  const { data: coursesData } = await supabase
    .from("courses")
    .select("id, title")
    .in("id", purchasedCourseIds);

  const courseTitleById = new Map<string, string>(
    (coursesData as DbCourseRow[] ?? []).map((c) => [c.id, c.title]),
  );

  // Build Course objects, falling back gracefully if the courses table
  // doesn't have a row for some reason.
  const coursesById = new Map<string, Course>();
  for (const mod of modules) {
    if (!coursesById.has(mod.courseId)) {
      coursesById.set(mod.courseId, {
        id: mod.courseId,
        title: courseTitleById.get(mod.courseId) ?? `Curso ${mod.courseId.slice(0, 8)}`,
        modules: [],
      });
    }
    coursesById.get(mod.courseId)!.modules.push(mod);
  }

  return {
    courses: Array.from(coursesById.values()).map((course) => ({
      ...course,
      modules: course.modules.sort((a, b) => a.index - b.index),
    })),
    progress,
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { courses, progress } = await loadDashboardData(user.id);
  const { calInterviewLink, calMentoringLink } = getCommerceConfig();

  // Mentoring application status for this user
  const supabase = await createSupabaseServerClient();
  const { data: applicationData } = await supabase
    .from("mentoring_applications")
    .select("status")
    .eq("email", (user.email ?? "").toLowerCase())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const mentoringStatus = (applicationData as { status?: string } | null)?.status ?? null;
  const mentorshipModuleUnlocked = progress.some((p) => p.mentorshipUnlocked);
  const mentorshipAvailable = mentorshipModuleUnlocked;

  // Build per-course view data
  const courseViews = courses.map((course) => {
    const orderedModules = course.modules;

    const moduleItems: ModuleListItem[] = orderedModules.map((m) => {
      const p =
        progress.find((mp) => mp.moduleId === m.id) ??
        ({
          moduleId: m.id,
          completed: false,
          quizScore: null,
          assignmentApproved: false,
          mentorshipUnlocked: false,
        } satisfies ModuleProgress);

      const accessible = canAccessModule(m, orderedModules, progress);
      const status: ModuleListItem["status"] = p.completed
        ? "completed"
        : accessible
          ? "current"
          : "locked";

      return { id: m.id, title: m.title, href: `/modules/${m.id}`, status };
    });

    const completedCount = orderedModules.filter((m) =>
      progress.find((p) => p.moduleId === m.id)?.completed,
    ).length;
    const totalCount = orderedModules.length;
    const percent =
      totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
    const currentModule =
      moduleItems.find((i) => i.status === "current") ??
      moduleItems.find((i) => i.status !== "locked") ??
      moduleItems[0];

    return { course, moduleItems, completedCount, totalCount, percent, currentModule };
  });

  return (
    <>
      <Suspense>
        <PurchaseToast />
      </Suspense>
      <ReadingLayout
      eyebrow="LICEU UNDERGROUND / SEU PROGRESSO"
      title="Disciplina antes de velocidade."
      subtitle="Prossiga módulo por módulo. Para avançar: lições completas, quiz ≥ 70%, e produção escrita aprovada."
      right={
        <div className="w-56 space-y-3">
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/50 px-4 py-3">
            <div className="font-[var(--font-liceu-mono)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
              CURSOS
            </div>
            <div className="mt-2 font-serif text-2xl text-[var(--liceu-text)]">
              {courses.length}
            </div>
            <div className="mt-1 font-[var(--font-liceu-sans)] text-xs text-[var(--liceu-muted)]">
              {courses.length === 1 ? "curso ativo" : "cursos ativos"}
            </div>
          </div>

          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/50 px-4 py-3">
            <div className="font-[var(--font-liceu-mono)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
              MENTORIA
            </div>
            {mentoringStatus === "active" ? (
              <>
                <div className="mt-2 font-[var(--font-liceu-sans)] text-xs text-[var(--liceu-accent)]">
                  Ativa
                </div>
                <div className="mt-1 font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
                  Agende sua próxima sessão.
                </div>
              </>
            ) : mentoringStatus === "pending_interview" ? (
              <>
                <div className="mt-2 font-[var(--font-liceu-sans)] text-xs text-[var(--liceu-text)]">
                  Entrevista pendente
                </div>
                <div className="mt-1 font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
                  Agende sua entrevista.
                </div>
              </>
            ) : mentoringStatus === "approved_pending_payment" ? (
              <>
                <div className="mt-2 font-[var(--font-liceu-sans)] text-xs text-[var(--liceu-text)]">
                  Aprovado
                </div>
                <div className="mt-1 font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
                  Verifique seu email para completar a inscrição.
                </div>
              </>
            ) : (
              <>
                <div className="mt-2 font-[var(--font-liceu-sans)] text-xs text-[var(--liceu-text)]">
                  {mentorshipAvailable ? "Sessão liberada" : "Bloqueada"}
                </div>
                <div className="mt-1 font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
                  {mentorshipAvailable
                    ? "Conclua um módulo para agendar."
                    : "Conclua o módulo atual para liberar."}
                </div>
              </>
            )}
          </div>
        </div>
      }
    >
      {courses.length === 0 ? (
        <p className="font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-muted)]">
          Nenhum curso foi atribuído a esta conta.
        </p>
      ) : (
        <div className="space-y-16">
          {courseViews.map(({ course, moduleItems, completedCount, totalCount, percent, currentModule }) => (
            <div key={course.id} className="space-y-8">
              {/* Course header with inline progress */}
              <div className="flex items-end justify-between gap-6 border-b border-[var(--liceu-stone)]/70 pb-4">
                <div>
                  <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                    CURSO
                  </div>
                  <div className="mt-1 font-serif text-[22px] leading-tight text-[var(--liceu-text)]">
                    {course.title}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-serif text-2xl text-[var(--liceu-text)]">
                    {percent}%
                  </div>
                  <div className="font-[var(--font-liceu-sans)] text-xs text-[var(--liceu-muted)]">
                    {completedCount} / {totalCount} módulos
                  </div>
                </div>
              </div>

              {/* Current module callout */}
              {currentModule && currentModule.status !== "completed" && (
                <section className="space-y-2">
                  <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                    MÓDULO ATUAL
                  </div>
                  <div className="font-serif text-xl leading-tight text-[var(--liceu-text)]">
                    {currentModule.title}
                  </div>
                </section>
              )}

              {/* Module list */}
              <section className="space-y-4">
                <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                  MÓDULOS
                </div>
                <ModuleList items={moduleItems} />
              </section>
            </div>
          ))}
        </div>
      )}

      {/* Mentoring action section */}
      {(mentoringStatus || mentorshipModuleUnlocked) && (
        <div className="mt-10 border-t border-[var(--liceu-stone)]/70 pt-8 space-y-4">
          <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            MENTORIA
          </div>

          {mentoringStatus === "pending_interview" && calInterviewLink && (
            <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 px-5 py-5">
              <div className="font-serif text-[17px] text-[var(--liceu-text)]">
                Entrevista de qualificação
              </div>
              <p className="mt-2 font-[var(--font-liceu-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
                Seu pagamento foi confirmado. Agende a entrevista no horário disponível.
              </p>
              <a
                href={calInterviewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block border border-[var(--liceu-text)] px-4 py-2 font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-text)] hover:bg-[var(--liceu-surface)]/40"
              >
                Agendar entrevista →
              </a>
            </div>
          )}

          {mentoringStatus === "approved_pending_payment" && (
            <div className="border border-[var(--liceu-accent)]/30 bg-[var(--liceu-surface)]/35 px-5 py-5">
              <div className="font-serif text-[17px] text-[var(--liceu-text)]">
                Aprovado para o programa
              </div>
              <p className="mt-2 font-[var(--font-liceu-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
                Você foi aprovado. Verifique seu email para o link de pagamento com o crédito da entrevista aplicado.
              </p>
            </div>
          )}

          {mentoringStatus === "active" && calMentoringLink && (
            <div className="border border-[var(--liceu-accent)]/30 bg-[var(--liceu-surface)]/35 px-5 py-5">
              <div className="font-serif text-[17px] text-[var(--liceu-text)]">
                Programa de mentoria ativo
              </div>
              <p className="mt-2 font-[var(--font-liceu-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
                As sessões são liberadas conforme você conclui os módulos. Agende quando estiver pronto.
              </p>
              {mentorshipModuleUnlocked && (
                <a
                  href={calMentoringLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-block border border-[var(--liceu-accent)]/60 px-4 py-2 font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-accent)] hover:bg-[var(--liceu-accent)]/10"
                >
                  Agendar sessão →
                </a>
              )}
              {!mentorshipModuleUnlocked && (
                <p className="mt-3 font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
                  Conclua o próximo módulo para liberar o agendamento.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </ReadingLayout>
    </>
  );
}

