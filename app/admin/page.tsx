import { MetricBlock } from "@/components/admin/MetricBlock";
import { ChartContainer } from "@/components/admin/ChartContainer";
import { BarChart, Heatmap, LineChart } from "@/components/admin/charts";
import { getAdminMetrics } from "@/lib/admin/queries";
import { seededMatrix, seededSeries } from "@/lib/admin/mock";

export default async function AdminCommandCenterPage() {
  const metrics = await getAdminMetrics();

  // Charts: start with deterministic series; swap to real aggregates as schema stabilizes.
  const daily = seededSeries(7_911, 28, 18, 110);
  const cohorts = ["C1", "C2", "C3", "C4", "C5", "C6"];
  const cohortValues = seededSeries(12_301, cohorts.length, 6, 48);
  const heatRows = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];
  const heatCols = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const heat = seededMatrix(99_101, heatRows.length, heatCols.length, 0, 1);

  return (
    <div className="p-4 md:p-6">
      <header className="border-b border-[var(--liceu-stone)]/70 pb-4">
        <div className="font-[var(--font-liceu-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          /admin
        </div>
        <div className="mt-2 font-serif text-[22px] leading-tight text-[var(--liceu-text)]">
          Command center
        </div>
        <div className="mt-2 max-w-3xl font-[var(--font-liceu-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
          Global metrics, activity overview, system state. No celebration. Only
          evidence.
        </div>
      </header>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-5">
        <MetricBlock
          label="Active students"
          value={metrics.activeStudents}
          note="Distinct learners with progress rows."
          highlight
        />
        <MetricBlock
          label="Modules completion"
          value={`${metrics.modulesCompletionRate}%`}
          note="Completed module_progress rows / total."
        />
        <MetricBlock
          label="Quiz success"
          value={`${metrics.quizSuccessRate}%`}
          note="Passed quiz attempts / total."
        />
        <MetricBlock
          label="Assignment approval"
          value={`${metrics.assignmentApprovalRate}%`}
          note="Approved submissions / total."
        />
        <MetricBlock
          label="Mentorship utilization"
          value={`${metrics.mentorshipUtilization}%`}
          note="Completed sessions / total."
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartContainer
          title="Daily activity"
          subtitle="Events/day (placeholder series until event log is stabilized)."
          right={
            <div className="font-[var(--font-liceu-mono)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
              28D WINDOW
            </div>
          }
        >
          <LineChart data={daily} />
        </ChartContainer>

        <ChartContainer
          title="Module completion per cohort"
          subtitle="Counts by cohort (placeholder)."
          right={
            <div className="font-[var(--font-liceu-mono)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
              COHORTS
            </div>
          }
        >
          <BarChart labels={cohorts} values={cohortValues} />
        </ChartContainer>

        <ChartContainer
          title="Student engagement heatmap"
          subtitle="Intensity by day (placeholder)."
          right={
            <div className="font-[var(--font-liceu-mono)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
              7D PATTERN
            </div>
          }
        >
          <Heatmap rows={heatRows} cols={heatCols} values={heat} />
        </ChartContainer>

        <ChartContainer
          title="System state"
          subtitle="Basic health signals (best effort)."
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[
              { k: "db", v: "connected" },
              { k: "auth", v: "supabase" },
              { k: "schema", v: "drifting" },
              { k: "audit", v: "minimal" },
            ].map((r) => (
              <div
                key={r.k}
                className="border border-[var(--liceu-stone)] bg-[var(--liceu-bg)] px-4 py-3"
              >
                <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                  {r.k}
                </div>
                <div className="mt-2 font-[var(--font-liceu-mono)] text-[12px] tabular-nums text-[var(--liceu-text)]">
                  {r.v}
                </div>
              </div>
            ))}
          </div>
        </ChartContainer>
      </div>
    </div>
  );
}
