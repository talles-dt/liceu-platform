import { ChartContainer } from "@/components/admin/ChartContainer";
import { BarChart } from "@/components/admin/charts";
import { ProgressTable, type ProgressRow } from "@/components/admin/tables/ProgressTable";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export default async function AdminProgressPage() {
  const supabase = createSupabaseAdminClient();

  const { data: modulesData } = await supabase
    .from("modules")
    .select("id, title, order_index")
    .order("order_index", { ascending: true });

  const { data: progressData } = await supabase
    .from("module_progress")
    .select("module_id, completed, updated_at");

  const modules =
    (modulesData as unknown as { id: string; title: string; order_index: number }[]) ?? [];
  const progress =
    (progressData as unknown as {
      module_id: string;
      completed: boolean | null;
      updated_at: string | null;
    }[]) ?? [];

  const byModule = new Map<string, { total: number; completed: number; lastUpdate: string | null }>();
  for (const p of progress) {
    const cur = byModule.get(p.module_id) ?? { total: 0, completed: 0, lastUpdate: null };
    cur.total += 1;
    if (p.completed === true) cur.completed += 1;
    if (p.updated_at && (!cur.lastUpdate || p.updated_at > cur.lastUpdate))
      cur.lastUpdate = p.updated_at;
    byModule.set(p.module_id, cur);
  }

  const rows: ProgressRow[] = modules.map((m) => {
    const agg = byModule.get(m.id) ?? { total: 0, completed: 0, lastUpdate: null };
    const rate = agg.total > 0 ? Math.round((agg.completed / agg.total) * 100) : 0;
    return {
      moduleId: m.id,
      title: m.title,
      order: m.order_index,
      total: agg.total,
      completed: agg.completed,
      completionRate: rate,
      lastUpdate: agg.lastUpdate ? agg.lastUpdate.slice(0, 10) : "—",
      medianDays: "—",
    };
  });

  const friction = rows
    .filter((r) => r.total > 0)
    .slice()
    .sort((a, b) => a.completionRate - b.completionRate)
    .slice(0, 3);

  return (
    <div className="p-4 md:p-6">
      <header className="border-b border-[var(--liceu-stone)]/70 pb-4">
        <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          /admin/progress
        </div>
        <div className="mt-2 font-serif text-[22px] leading-tight text-[var(--liceu-text)]">
          Progress map
        </div>
        <div className="mt-2 font-[var(--font-liceu-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
          Module-by-module completion, bottlenecks, time per module (when data is available).
        </div>
      </header>

      {friction.length > 0 && (
        <div className="mt-5 border border-[var(--liceu-accent)]/35 bg-[var(--liceu-bg)] px-4 py-4">
          <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-accent)]">
            critical friction points
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
            {friction.map((f) => (
              <div
                key={f.moduleId}
                className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/20 px-3 py-3"
              >
                <div className="font-serif text-[14px] text-[var(--liceu-text)]">{f.title}</div>
                <div className="mt-2 font-[var(--font-liceu-mono)] text-[12px] tabular-nums text-[var(--liceu-accent)]">
                  {f.completionRate}%
                </div>
                <div className="mt-1 font-[var(--font-liceu-sans)] text-[11px] text-[var(--liceu-muted)]">
                  completion rate
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartContainer
          title="Completion rate by module"
          subtitle="Percent completed per module (derived from module_progress)."
        >
          <BarChart
            labels={rows.map((r) => `M${r.order + 1}`)}
            values={rows.map((r) => r.completionRate)}
          />
        </ChartContainer>

        <ChartContainer
          title="Time per module"
          subtitle="Requires start/finish timestamps. Pending instrumentation."
        >
          <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] px-4 py-4">
            <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
              instrumentation
            </div>
            <div className="mt-2 font-serif text-[14px] leading-[1.85] text-[var(--liceu-text)]">
              To compute time-per-module rigorously, we need{" "}
              <span className="font-[var(--font-liceu-mono)] text-[12px]">started_at</span> and{" "}
              <span className="font-[var(--font-liceu-mono)] text-[12px]">completed_at</span>{" "}
              per module per student.
            </div>
          </div>
        </ChartContainer>
      </div>

      <div className="mt-6">
        <ProgressTable rows={rows} />
      </div>
    </div>
  );
}
