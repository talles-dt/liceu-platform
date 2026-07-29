import { MetricBlock } from "@/components/admin/MetricBlock";
import { ChartContainer } from "@/components/admin/ChartContainer";
import { SystemLogsTable, type LogRow } from "@/components/admin/tables/SystemLogsTable";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export default async function AdminSystemPage() {
  const supabase = createSupabaseAdminClient();

  const [{ data: users }, { data: progress }] = await Promise.all([
    supabase.from("users").select("id, last_login_at, created_at, role").limit(10000),
    supabase.from("module_progress").select("user_id, completed, started_at, completed_at, updated_at").limit(10000),
  ]);

  const allUsers = (users as unknown as { id: string; last_login_at?: string | null; created_at?: string | null; role?: string | null }[]) ?? [];
  const progressRows =
    (progress as unknown as { user_id: string; completed?: boolean | null; started_at?: string | null; completed_at?: string | null; updated_at?: string | null }[]) ?? [];

  const totalUsers = allUsers.length;
  const now = Date.now();
  const daysAgo = (iso?: string | null) => {
    if (!iso) return 999;
    const t = new Date(iso).getTime();
    if (!Number.isFinite(t)) return 999;
    return Math.floor((now - t) / (1000 * 60 * 60 * 24));
  };

  const activeUsers = new Set(
    progressRows
      .filter((r) => {
        const latest = r.updated_at || r.completed_at || r.started_at;
        return latest ? daysAgo(latest) <= 7 : false;
      })
      .map((r) => r.user_id),
  ).size;

  const dbHealth = totalUsers > 0 || progressRows.length > 0 ? "ok" : "unknown";

  const recentActivity = progressRows
    .map((r) => ({
      user_id: r.user_id,
      updated_at: r.updated_at || r.completed_at || r.started_at,
    }))
    .filter((r) => r.updated_at)
    .sort((a, b) => (b.updated_at ?? "").localeCompare(a.updated_at ?? ""))
    .slice(0, 50);

  const logs: LogRow[] = recentActivity.map((r) => ({
    ts: r.updated_at!.slice(0, 19).replace("T", " "),
    actor: r.user_id,
    action: "module_progress",
    target: "—",
  }));

  return (
    <div className="p-4 md:p-6">
      <header className="border-b border-[var(--liceu-stone)]/70 pb-4">
        <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          /admin/system
        </div>
        <div className="mt-2 font-[var(--font-noto-serif)] text-[22px] leading-tight text-[var(--liceu-text)]">
          System state
        </div>
        <div className="mt-2 font-[var(--font-work-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
          Minimal UI. Pure function. Health, counts, and action logs.
        </div>
      </header>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <MetricBlock label="total users" value={totalUsers} />
        <MetricBlock label="active (7d)" value={activeUsers} highlight />
        <MetricBlock label="db health" value={dbHealth} />
        <MetricBlock label="module_progress" value={`${progressRows.length} rows`} />
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
                v: progressRows.length ? "read ok" : "empty/unknown",
              },
            ].map((r) => (
              <div
                key={r.k}
                className="flex items-baseline justify-between gap-4 border border-[var(--liceu-stone)] bg-[var(--liceu-neutral)] px-4 py-3"
              >
                <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                  {r.k}
                </div>
                <div className="font-[var(--font-space-grotesk)] text-[12px] tabular-nums text-[var(--liceu-text)]">
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
          <SystemLogsTable rows={logs} />
        </ChartContainer>
      </div>
    </div>
  );
}
