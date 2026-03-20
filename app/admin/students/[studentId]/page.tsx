import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { StudentPanel } from "@/components/admin/StudentPanel";
import { DataTable } from "@/components/admin/DataTable";

type Props = {
  params: Promise<{ studentId: string }>;
};

export default async function AdminStudentDetailPage({ params }: Props) {
  const { studentId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: userRow } = await supabase
    .from("users")
    .select("id, name, email")
    .eq("id", studentId)
    .maybeSingle();

  if (!userRow) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, order_index")
    .order("order_index", { ascending: true });

  const { data: progress } = await supabase
    .from("module_progress")
    .select("module_id, completed, quiz_score, assignment_submitted, mentorship_unlocked, updated_at")
    .eq("user_id", studentId);

  const moduleById = new Map(
    ((modules as unknown as { id: string; title: string; order_index: number }[]) ??
      []).map((m) => [m.id, m]),
  );

  const prog =
    (progress as unknown as {
      module_id: string;
      completed: boolean | null;
      quiz_score: number | null;
      assignment_submitted: boolean | null;
      mentorship_unlocked: boolean | null;
      updated_at: string | null;
    }[]) ?? [];

  const total = Math.max(1, prog.length);
  const done = prog.filter((r) => r.completed === true).length;
  const completionPct = Math.round((done / total) * 100);

  const failures = {
    quiz: prog.filter((r) => (r.quiz_score ?? 0) > 0 && (r.quiz_score ?? 0) < 70)
      .length,
    assignment: prog.filter((r) => r.assignment_submitted === false).length,
  };

  const last = prog
    .map((r) => r.updated_at ?? null)
    .filter(Boolean)
    .sort()
    .at(-1) as string | undefined;

  const name =
    (userRow as unknown as { name?: string | null; email?: string | null }).name?.trim() ||
    (userRow as unknown as { email?: string | null }).email?.trim() ||
    studentId.slice(0, 8);

  const diagnosis = [
    {
      k: "failing",
      v:
        failures.quiz > 0
          ? "quiz < 70%"
          : failures.assignment > 0
            ? "assignment pending"
            : "none detected",
    },
    {
      k: "slow",
      v: "derive from time-per-module (next iteration)",
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <header className="border-b border-[var(--liceu-stone)]/70 pb-4">
        <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          /admin/students/{studentId}
        </div>
        <div className="mt-2 font-serif text-[22px] leading-tight text-[var(--liceu-text)]">
          Student dossier
        </div>
        <div className="mt-2 font-[var(--font-liceu-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
          {name}
        </div>
      </header>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[420px_1fr]">
        <StudentPanel
          title="Diagnosis panel"
          emphasis={diagnosis}
          rows={[
            { k: "completion", v: `${completionPct}%` },
            { k: "modules completed", v: `${done}/${total}` },
            { k: "last activity", v: last ? last.slice(0, 10) : "—" },
            { k: "mentorship", v: prog.some((r) => r.mentorship_unlocked) ? "unlocked" : "locked" },
          ]}
        />

        <div className="space-y-4">
          <DataTable
            caption="module progress"
            rows={prog
              .slice()
              .sort((a, b) => {
                const ma = moduleById.get(a.module_id)?.order_index ?? 999;
                const mb = moduleById.get(b.module_id)?.order_index ?? 999;
                return ma - mb;
              })
              .map((r) => ({
                ...r,
                title: moduleById.get(r.module_id)?.title ?? r.module_id,
                order: moduleById.get(r.module_id)?.order_index ?? 999,
              }))}
            rowKey={(r) => `${r.module_id}`}
            columns={[
              {
                key: "module",
                header: "module",
                render: (r) => (
                  <span className="font-serif text-[13px]">{r.title}</span>
                ),
              },
              {
                key: "completed",
                header: "completed",
                render: (r) => (
                  <span className="font-[var(--font-liceu-mono)] text-[11px]">
                    {r.completed ? "yes" : "no"}
                  </span>
                ),
              },
              {
                key: "quiz",
                header: "quiz",
                className: "text-right",
                render: (r) => (
                  <span className="font-[var(--font-liceu-mono)] tabular-nums text-[11px]">
                    {r.quiz_score ?? "—"}
                  </span>
                ),
              },
              {
                key: "assignment",
                header: "assignment",
                render: (r) => (
                  <span className="font-[var(--font-liceu-mono)] text-[11px]">
                    {r.assignment_submitted ? "submitted" : "missing"}
                  </span>
                ),
              },
              {
                key: "updated",
                header: "updated",
                render: (r) => (
                  <span className="font-[var(--font-liceu-mono)] tabular-nums text-[11px] text-[var(--liceu-muted)]">
                    {r.updated_at ? r.updated_at.slice(0, 10) : "—"}
                  </span>
                ),
              },
            ]}
          />

          <DataTable
            caption="quiz scores (placeholder)"
            rows={prog.map((r) => ({
              module: moduleById.get(r.module_id)?.title ?? r.module_id,
              score: r.quiz_score ?? null,
            }))}
            rowKey={(r) => r.module}
            columns={[
              {
                key: "m",
                header: "module",
                render: (r) => (
                  <span className="font-serif text-[13px]">{r.module}</span>
                ),
              },
              {
                key: "s",
                header: "score",
                className: "text-right",
                render: (r) => (
                  <span className="font-[var(--font-liceu-mono)] tabular-nums text-[11px]">
                    {r.score ?? "—"}
                  </span>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

