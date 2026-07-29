import { notFound } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { StudentPanel } from "@/components/admin/StudentPanel";
import {
  StudentProgressTable,
  StudentQuizTable,
  type StudentProgressRow,
  type StudentQuizRow,
} from "@/components/admin/tables/StudentDetailTables";

type Props = {
  params: Promise<{ studentId: string }>;
};

export default async function AdminStudentDetailPage({ params }: Props) {
  const { studentId } = await params;
  const supabase = createSupabaseAdminClient();

  const { data: userRow } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("id", studentId)
    .maybeSingle();

  if (!userRow) notFound();

  const [{ data: modules }, { data: progress }, { data: lessons }] = await Promise.all([
    supabase
      .from("liceu_modules")
      .select("id, title, code, order_index")
      .order("order_index", { ascending: true }),
    supabase
      .from("liceu_learner_progression")
      .select("completed_lessons, current_module_id, updated_at")
      .eq("user_id", studentId)
      .maybeSingle(),
    supabase
      .from("liceu_lessons")
      .select("id, module_id, title, is_published")
      .eq("is_published", true),
  ]);

  const moduleById = new Map(
    ((modules as unknown as { id: string; title: string; code: string; order_index: number }[]) ?? []).map(
      (m) => [m.id, m],
    ),
  );

  const lessonsByModule = new Map<string, Array<{ id: string; title: string }>>();
  for (const l of (lessons as unknown as { id: string; module_id: string; title: string }[]) ?? []) {
    const arr = lessonsByModule.get(l.module_id) ?? [];
    arr.push({ id: l.id, title: l.title });
    lessonsByModule.set(l.module_id, arr);
  }

  const completedLessons = (progress as unknown as { completed_lessons: string[] })?.completed_lessons ?? [];
  const currentModuleId = (progress as unknown as { current_module_id: string | null })?.current_module_id ?? null;
  const lastActivity = (progress as unknown as { updated_at: string | null })?.updated_at ?? null;

  const total = (lessons as unknown as { id: string }[])?.length ?? 1;
  const done = completedLessons.length;
  const completionPct = Math.round((done / total) * 100);

  const currentModule = currentModuleId && moduleById.get(currentModuleId);
  const currentModuleTitle = currentModule ? `${currentModule.code}. ${currentModule.title}` : "—";

  const last = lastActivity;

  const user = userRow as unknown as { name?: string | null; email?: string | null };
  const name = user.name?.trim() || user.email?.trim() || studentId.slice(0, 8);

  const diagnosis = [
    {
      k: "current module",
      v: currentModuleTitle,
    },
    { k: "slow", v: "derive from time-per-lesson (next iteration)" },
  ];

  const progressRows: StudentProgressRow[] = (modules as unknown as { id: string; title: string; code: string; order_index: number }[])?.map((m) => {
    const moduleLessons = lessonsByModule.get(m.id) ?? [];
    const moduleCompletedLessons = completedLessons.filter(lessonId => moduleLessons.some((l: { id: string }) => l.id === lessonId));
    const moduleCompletionPct = moduleLessons.length > 0 ? Math.round((moduleCompletedLessons.length / moduleLessons.length) * 100) : 0;
    
    return {
      module_id: m.id,
      title: `${m.code}. ${m.title}`,
      completed: moduleCompletionPct === 100,
      quiz_score: null,
      assignment_submitted: null,
      mentorship_unlocked: null,
      updated_at: lastActivity,
      order: m.order_index,
      completion_pct: moduleCompletionPct,
    };
  }) ?? [];

  const quizRows: StudentQuizRow[] = [];

  return (
    <div className="p-4 md:p-6">
      <header className="border-b border-[var(--liceu-stone)]/70 pb-4">
        <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          /admin/students/{studentId}
        </div>
        <div className="mt-2 font-[var(--font-noto-serif)] text-[22px] leading-tight text-[var(--liceu-text)]">
          Student dossier
        </div>
        <div className="mt-2 font-[var(--font-work-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
          {name}
        </div>
      </header>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[420px_1fr]">
        <StudentPanel
          title="Diagnosis panel"
          emphasis={diagnosis}
          rows={[
            { k: "completion", v: `${completionPct}%` },
            { k: "lessons completed", v: `${done}/${total}` },
            { k: "last activity", v: last ? last.slice(0, 10) : "—" },
            { k: "mentorship", v: "pending instrumentation" },
          ]}
        />

        <div className="space-y-4">
          <StudentProgressTable rows={progressRows} />
          <StudentQuizTable rows={quizRows} />
        </div>
      </div>
    </div>
  );
}
