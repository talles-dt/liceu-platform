import { redirect } from "next/navigation";
import type { Course, Module, ModuleProgress } from "@/lib/domain";
import { canAccessModule } from "@/lib/domain";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";
import { ReadingLayout } from "@/components/ReadingLayout";
import { ModuleList, type ModuleListItem } from "@/components/ModuleList";

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

  const { data: modulesData } = await supabase
    .from("modules")
    .select("id, course_id, order_index, title")
    .order("course_id")
    .order("order_index", { ascending: true });

  const { data: progressData } = await supabase
    .from("module_progress")
    .select(
      "module_id, completed, quiz_score, assignment_submitted, mentorship_unlocked",
    )
    .eq("user_id", userId);

  const modules: Module[] =
    modulesData?.map((m: DbModuleRow) => ({
      id: m.id,
      courseId: m.course_id,
      index: m.order_index,
      title: m.title,
    })) ?? [];

  const coursesById = new Map<string, Course>();
  for (const mod of modules) {
    if (!coursesById.has(mod.courseId)) {
      coursesById.set(mod.courseId, {
        id: mod.courseId,
        title: `Course ${mod.courseId}`,
        modules: [],
      });
    }
    coursesById.get(mod.courseId)!.modules.push(mod);
  }

  const progress: ModuleProgress[] =
    progressData?.map((p: DbModuleProgressRow) => ({
      moduleId: p.module_id,
      completed: p.completed,
      quizScore: p.quiz_score,
      assignmentApproved: p.assignment_submitted,
      mentorshipUnlocked: p.mentorship_unlocked,
    })) ?? [];

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

  if (!user) {
    redirect("/login");
  }

  const { courses, progress } = await loadDashboardData(user.id);

  const firstCourse = courses[0];
  const orderedModules = firstCourse?.modules ?? [];

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

    return {
      id: m.id,
      title: m.title,
      href: `/modules/${m.id}`,
      status,
    };
  });

  const completedCount = progress.filter((p) => p.completed).length;
  const totalCount = orderedModules.length;
  const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const currentModule =
    moduleItems.find((i) => i.status === "current") ??
    moduleItems.find((i) => i.status !== "locked") ??
    moduleItems[0];

  const mentorshipAvailable = progress.some((p) => p.mentorshipUnlocked);

  return (
    <ReadingLayout
      eyebrow="LICEU UNDERGROUND / SEU PROGRESSO"
      title="Disciplina antes de velocidade."
      subtitle="Prossiga módulo por módulo. Para avançar: lições completas, quiz ≥ 70%, e produção escrita aprovada."
      right={
        <div className="w-56 space-y-3">
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/50 px-4 py-3">
            <div className="font-[var(--font-liceu-mono)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
              CURSO
            </div>
            <div className="mt-2 font-serif text-2xl text-[var(--liceu-text)]">
              {percent}%
            </div>
            <div className="mt-1 font-[var(--font-liceu-sans)] text-xs text-[var(--liceu-muted)]">
              {completedCount} / {totalCount} módulos
            </div>
          </div>

          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/50 px-4 py-3">
            <div className="font-[var(--font-liceu-mono)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
              MENTORIA
            </div>
            <div className="mt-2 font-[var(--font-liceu-sans)] text-xs text-[var(--liceu-text)]">
              {mentorshipAvailable ? "Disponível" : "Bloqueada"}
            </div>
            <div className="mt-1 font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
              {mentorshipAvailable
                ? "Sessão liberada após conclusão."
                : "Conclua o módulo atual para liberar."}
            </div>
          </div>
        </div>
      }
    >
      {courses.length === 0 ? (
        <p className="font-[var(--font-liceu-sans)] text-sm text-[var(--liceu-muted)]">
          Nenhum curso foi atribuído a esta conta.
        </p>
      ) : (
        <div className="space-y-10">
          <section className="space-y-4">
            <div className="flex items-end justify-between gap-6">
              <div>
                <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                  MÓDULO ATUAL
                </div>
                <div className="mt-2 font-serif text-2xl leading-tight text-[var(--liceu-text)]">
                  {currentModule?.title ?? "—"}
                </div>
              </div>
              <div className="text-right">
                <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                  PRÓXIMA TAREFA
                </div>
                <div className="mt-2 font-[var(--font-liceu-sans)] text-xs text-[var(--liceu-text)]">
                  Ler o próximo capítulo
                </div>
                <div className="mt-1 font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
                  (definido por progresso nas lições)
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              MÓDULOS
            </div>
            <ModuleList items={moduleItems} />
          </section>
        </div>
      )}
    </ReadingLayout>
  );
}

