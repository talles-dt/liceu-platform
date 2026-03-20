import { DataTable } from "@/components/admin/DataTable";
import { ChartContainer } from "@/components/admin/ChartContainer";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { seededSeries } from "@/lib/admin/mock";
import { BarChart } from "@/components/admin/charts";

type SessionRow = {
  id: string;
  student: string;
  when: string;
  status: string;
  readiness: string;
};

export default async function AdminMentorshipPage() {
  const supabase = await createSupabaseServerClient();

  const { data: sessionsData, error } = await supabase
    .from("mentorship_sessions")
    .select("id, user_id, scheduled_at, status, module_id")
    .order("scheduled_at", { ascending: true })
    .limit(200);

  const sessions =
    (!error
      ? ((sessionsData as unknown as {
          id: string;
          user_id: string;
          scheduled_at: string | null;
          status: string | null;
          module_id?: string | null;
        }[]) ?? [])
      : []) ?? [];

  const userIds = Array.from(new Set(sessions.map((s) => s.user_id)));
  const { data: usersData } =
    userIds.length > 0
      ? await supabase.from("users").select("id, name, email").in("id", userIds)
      : { data: [] as unknown[] };

  const users =
    (usersData as unknown as { id: string; name?: string | null; email?: string | null }[]) ??
    [];
  const userById = new Map(users.map((u) => [u.id, u]));

  // readiness indicator: if module_progress shows completed for module_id (best effort)
  const moduleIds = Array.from(
    new Set(sessions.map((s) => s.module_id).filter(Boolean) as string[]),
  );

  const { data: progData } =
    moduleIds.length > 0 && userIds.length > 0
      ? await supabase
          .from("module_progress")
          .select("user_id, module_id, completed")
          .in("user_id", userIds)
          .in("module_id", moduleIds)
      : { data: [] as unknown[] };

  const prog =
    (progData as unknown as { user_id: string; module_id: string; completed: boolean | null }[]) ??
    [];

  const readySet = new Set(
    prog.filter((p) => p.completed === true).map((p) => `${p.user_id}:${p.module_id}`),
  );

  const rows: SessionRow[] =
    sessions.length > 0
      ? sessions.map((s) => {
          const u = userById.get(s.user_id);
          const student =
            (u?.name?.trim() || u?.email?.trim() || s.user_id.slice(0, 8)) as string;
          const when = s.scheduled_at ? s.scheduled_at.replace("T", " ").slice(0, 16) : "—";
          const status = (s.status ?? "upcoming").toLowerCase();
          const readiness =
            s.module_id && readySet.has(`${s.user_id}:${s.module_id}`)
              ? "ready"
              : "not ready";
          return { id: s.id, student, when, status, readiness };
        })
      : [
          {
            id: "placeholder",
            student: "—",
            when: "—",
            status: "upcoming",
            readiness: "—",
          },
        ];

  const slots = seededSeries(44_201, 6, 0, 6);
  const slotLabels = ["wk1", "wk2", "wk3", "wk4", "wk5", "wk6"];

  return (
    <div className="p-4 md:p-6">
      <header className="border-b border-[var(--liceu-stone)]/70 pb-4">
        <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          /admin/mentorship
        </div>
        <div className="mt-2 font-serif text-[22px] leading-tight text-[var(--liceu-text)]">
          Mentorship operations
        </div>
        <div className="mt-2 font-[var(--font-liceu-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
          Upcoming / completed / missed sessions. Waitlist and slots. Readiness
          indicator based on module completion (best effort).
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartContainer
          title="Available slots (placeholder)"
          subtitle="Replace with real availability when scheduling provider is chosen."
        >
          <BarChart labels={slotLabels} values={slots} />
        </ChartContainer>

        <ChartContainer
          title="Waitlist (placeholder)"
          subtitle="Add a waitlist table when schema is defined."
        >
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] px-4 py-4">
            <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              waitlist
            </div>
            <div className="mt-2 font-serif text-[14px] leading-[1.85] text-[var(--liceu-text)]">
              Not yet instrumented. When enabled, this panel will show queue
              length, median wait time, and readiness distribution.
            </div>
          </div>
        </ChartContainer>
      </div>

      <div className="mt-6">
        <DataTable
          caption="sessions"
          rows={rows}
          rowKey={(r) => r.id}
          columns={[
            {
              key: "student",
              header: "student",
              render: (r) => <span className="font-serif">{r.student}</span>,
            },
            {
              key: "when",
              header: "scheduled",
              render: (r) => (
                <span className="font-[var(--font-liceu-mono)] tabular-nums text-[var(--liceu-muted)]">
                  {r.when}
                </span>
              ),
            },
            {
              key: "status",
              header: "status",
              render: (r) => (
                <span
                  className={[
                    "inline-flex items-center border px-2 py-0.5",
                    "font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em]",
                    r.status === "completed"
                      ? "border-[var(--liceu-accent)]/40 text-[var(--liceu-accent)]"
                      : r.status === "missed"
                        ? "border-[var(--liceu-stone)] text-[var(--liceu-text)]"
                        : "border-[var(--liceu-stone)]/70 text-[var(--liceu-muted)]",
                  ].join(" ")}
                >
                  {r.status}
                </span>
              ),
            },
            {
              key: "readiness",
              header: "readiness",
              className: "text-right",
              render: (r) => (
                <span
                  className={[
                    "font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.18em]",
                    r.readiness === "ready"
                      ? "text-[var(--liceu-accent)]"
                      : "text-[var(--liceu-muted)]",
                  ].join(" ")}
                >
                  {r.readiness}
                </span>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}

