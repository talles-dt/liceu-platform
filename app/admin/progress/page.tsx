import { ChartContainer } from "@/components/admin/ChartContainer";
import { BarChart } from "@/components/admin/charts";
import { ProgressTable, type ProgressRow } from "@/components/admin/tables/ProgressTable";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

export default async function AdminProgressPage() {
  const supabase = createSupabaseAdminClient();

  const [{ data: modulesData }, { data: progressData }] = await Promise.all([
    supabase
      .from("modules")
      .select("id, title, order_index")
      .order("order_index", { ascending: true }),
    supabase
      .from("module_progress")
      .select("module_id, completed, updated_at, started_at, completed_at"),
  ]);

  const modules =
    (modulesData as unknown as { id: string; title: string; order_index: number }[]) ?? [];
  const progress =
    (progressData as unknown as {
      module_id: string;
      completed: boolean | null;
      updated_at: string | null;
      started_at: string | null;
      completed_at: string | null;
    }[]) ?? [];

  type Agg = {
    total: number;
    completed: number;
    lastUpdate: string | null;
    durations: number[]; // days from started_at to completed_at
  };

  const byModule = new Map<string, Agg>();

  for (const p of progress) {
    const cur = byModule.get(p.module_id) ?? {
      total: 0,
      completed: 0,
      lastUpdate: null,
      durations: [],
    };
    cur.total += 1;
    if (p.completed === true) cur.completed += 1;
    if (p.updated_at && (!cur.lastUpdate || p.updated_at > cur.lastUpdate))
      cur.lastUpdate = p.updated_at;

    // Compute duration in days if both timestamps exist
    if (p.started_at && p.completed_at) {
      const start = new Date(p.started_at).getTime();
      const end = new Date(p.completed_at).getTime();
      const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
      if (days >= 0) cur.durations.push(days);
    }

    byModule.set(p.module_id, cur);
  }

  const rows: ProgressRow[] = modules.map((m) => {
    const agg = byModule.get(m.id) ?? { total: 0, completed: 0, lastUpdate: null, durations: [] };
    const rate = agg.total > 0 ? Math.round((agg.completed / agg.total) * 100) : 0;
    const med = agg.durations.length > 0 ? median(agg.durations) : null;

    return {
      moduleId: m.id,
      title: m.title,
      order: m.order_index,
      total: agg.total,
      completed: agg.completed,
      completionRate: rate,
      lastUpdate: agg.lastUpdate ? agg.lastUpdate.slice(0, 10) : "—",
      medianDays: med !== null ? String(med) : "—",
    };
  });

  const friction = rows
    .filter((r) => r.total > 0)
    .slice()
    .sort((a, b) => a.completionRate - b.completionRate)
    .slice(0, 3);

  // Only show time chart if we have real data
  const hasTimeData = rows.some((r) => r.medianDays !== "—");
  const timeChartLabels = rows.map((r) => `M${r.order + 1}`);
  const timeChartValues = rows.map((r) => (r.medianDays !== "—" ? Number(r.medianDays) : 0));

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
          Module-by-module completion, bottlenecks, median days per module.
        </div>
      </header>

      {friction.length > 0 && (
        <div className="mt-5 border border-[var(--liceu-accent)]/35 bg-[var(--liceu-bg)] px-4 py-4">
          <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-accent)]">
            critical friction points
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
            {friction.map((f) => (
              <div key={f.moduleId} className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/20 px-3 py-3">
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
          subtitle="Percent completed per module."
        >
          <BarChart labels={timeChartLabels} values={rows.map((r) => r.completionRate)} />
        </ChartContainer>

        <ChartContainer
          title="Median days per module"
          subtitle={hasTimeData ? "Days from first access to completion." : "Pending data — requires students to start and complete modules."}
        >
          {hasTimeData ? (
            <BarChart labels={timeChartLabels} values={timeChartValues} />
          ) : (
            <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] px-4 py-4">
              <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                aguardando dados
              </div>
              <p className="mt-2 font-serif text-[13px] leading-[1.85] text-[var(--liceu-muted)]">
                O gráfico será preenchido quando alunos concluírem módulos com os timestamps registrados.
              </p>
            </div>
          )}
        </ChartContainer>
      </div>

      <div className="mt-6">
        <ProgressTable rows={rows} />
      </div>
    </div>
  );
}
