import { DataTable } from "@/components/admin/DataTable";
import { MetricBlock } from "@/components/admin/MetricBlock";
import { ChartContainer } from "@/components/admin/ChartContainer";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type LogRow = {
  ts: string;
  actor: string;
  action: string;
  target: string;
};

export default async function AdminSystemPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: users }, { data: progress }, { data: sessions }] = await Promise.all([
    supabase.from("users").select("id").limit(10000),
    supabase.from("module_progress").select("user_id, updated_at").limit(10000),
    supabase.from("mentorship_sessions").select("id").limit(1), // existence probe
  ]);

  const totalUsers = (users as unknown as { id: string }[])?.length ?? 0;

  const progressRows =
    (progress as unknown as { user_id: string; updated_at?: string | null }[]) ?? [];

  // Reference time derived from data (keeps render deterministic).
  const referenceMs = progressRows.reduce((max, r) => {
    const t = r.updated_at ? new Date(r.updated_at).getTime() : NaN;
    if (!Number.isFinite(t)) return max;
    return Math.max(max, t);
  }, 0);

  const activeUsers =
    progressRows
      .filter((r) => {
        const t = r.updated_at ? new Date(r.updated_at).getTime() : NaN;
        if (!Number.isFinite(t)) return false;
        return referenceMs > 0 && referenceMs - t <= 1000 * 60 * 60 * 24 * 7;
      })
      .reduce((set, r) => set.add(r.user_id), new Set<string>()).size ?? 0;

  const dbHealth =
    totalUsers > 0 ? "ok" : (progress as unknown as unknown[])?.length ? "ok" : "unknown";

  const mentorshipTable = Array.isArray(sessions) ? "present" : "unknown";

  // Minimal local "logs" (until an audit table exists).
  const logs: LogRow[] = [
    {
      ts: "—",
      actor: "system",
      action: "render",
      target: "/admin/system",
    },
    {
      ts: "—",
      actor: "system",
      action: "probe",
      target: "module_progress",
    },
    {
      ts: "—",
      actor: "system",
      action: "probe",
      target: "users",
    },
  ];

  return (
    <div className="p-4 md:p-6">
      <header className="border-b border-[var(--liceu-stone)]/70 pb-4">
        <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          /admin/system
        </div>
        <div className="mt-2 font-serif text-[22px] leading-tight text-[var(--liceu-text)]">
          System state
        </div>
        <div className="mt-2 font-[var(--font-liceu-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
          Minimal UI. Pure function. Health, counts, and action logs.
        </div>
      </header>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MetricBlock label="total users" value={totalUsers} />
        <MetricBlock label="active (7d)" value={activeUsers} highlight />
        <MetricBlock label="db health" value={dbHealth} />
        <MetricBlock label="mentorship table" value={mentorshipTable} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartContainer
          title="Database health"
          subtitle="Best-effort probes (expand with real monitoring later)."
        >
          <div className="space-y-2">
            {[
              { k: "users", v: totalUsers ? "read ok" : "empty/unknown" },
              {
                k: "module_progress",
                v: (progress as unknown as unknown[])?.length ? "read ok" : "empty/unknown",
              },
              { k: "mentorship_sessions", v: mentorshipTable },
            ].map((r) => (
              <div
                key={r.k}
                className="flex items-baseline justify-between gap-4 border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] px-4 py-3"
              >
                <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                  {r.k}
                </div>
                <div className="font-[var(--font-liceu-mono)] text-[12px] tabular-nums text-[var(--liceu-text)]">
                  {r.v}
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>

        <ChartContainer
          title="Operator logs"
          subtitle="Replace with an audit table when available."
        >
          <DataTable
            rows={logs}
            rowKey={(r) => `${r.ts}-${r.action}-${r.target}`}
            columns={[
              {
                key: "ts",
                header: "ts",
                render: (r) => (
                  <span className="font-[var(--font-liceu-mono)] tabular-nums text-[var(--liceu-muted)]">
                    {r.ts}
                  </span>
                ),
              },
              {
                key: "actor",
                header: "actor",
                render: (r) => (
                  <span className="font-[var(--font-liceu-mono)] text-[11px]">
                    {r.actor}
                  </span>
                ),
              },
              {
                key: "action",
                header: "action",
                render: (r) => (
                  <span className="font-[var(--font-liceu-mono)] text-[11px]">
                    {r.action}
                  </span>
                ),
              },
              {
                key: "target",
                header: "target",
                render: (r) => (
                  <span className="font-[var(--font-liceu-mono)] text-[11px] text-[var(--liceu-text)]">
                    {r.target}
                  </span>
                ),
              },
            ]}
          />
        </ChartContainer>
      </div>
    </div>
  );
}

