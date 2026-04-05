import { MetricBlock } from "@/components/admin/MetricBlock";
import { ChartContainer } from "@/components/admin/ChartContainer";
import { BarChart, Heatmap, LineChart } from "@/components/admin/charts";
import { getAdminMetrics } from "@/lib/admin/queries";
import { seededMatrix, seededSeries } from "@/lib/admin/mock";

export const revalidate = 60;

export default async function AdminCommandCenterPage() {
  const metrics = await getAdminMetrics();

  // Charts: start with deterministic series; swap to real aggregates as schema stabilizes.
  const daily = seededSeries(7_911, 28, 18, 110);
  const cohorts = ["C1", "C2", "C3", "C4", "C5", "C6"];
  const cohortValues = seededSeries(12_301, cohorts.length, 6, 48);
  const heatRows = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8"];
  const heatCols = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const heat = seededMatrix(99_101, heatRows.length, heatCols.length, 0, 1);

  const grammarScore = 87;
  const rhetoricScore = 72;

  const students = [
    { id: "S-001", name: "Ana Silva", module: "Grammar I", status: "Active", progress: 92 },
    { id: "S-002", name: "Bruno Costa", module: "Logic II", status: "Active", progress: 78 },
    { id: "S-003", name: "Carla Mendes", module: "Rhetoric I", status: "Evaluation", progress: 100 },
    { id: "S-004", name: "Diogo Ferreira", module: "Grammar II", status: "Active", progress: 65 },
    { id: "S-005", name: "Eva Rodrigues", module: "Logic I", status: "Completed", progress: 100 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-12">
      {/* ===== TRIVIUM MASTERY HERO ===== */}
      <section>
        {/* Header row with title + metric cards */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="font-[var(--font-noto-serif)] text-2xl font-black uppercase tracking-tight text-[var(--liceu-text)]">
            Trivium Mastery
          </h1>
          <div className="flex gap-4">
            <div className="bg-[var(--liceu-surface-container)] px-4 py-2 border-l-2 border-[var(--liceu-secondary)]">
              <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                Active Initiates
              </div>
              <div className="font-[var(--font-space-grotesk)] text-2xl font-black text-[var(--liceu-text)] tabular-nums">
                {metrics.activeStudents}
              </div>
            </div>
            <div className="bg-[var(--liceu-surface-container)] px-4 py-2 border-l-2 border-[var(--liceu-accent)]">
              <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                Quiz Success
              </div>
              <div className="font-[var(--font-space-grotesk)] text-2xl font-black text-[var(--liceu-text)] tabular-nums">
                {metrics.quizSuccessRate}%
              </div>
            </div>
          </div>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Grammar Foundation */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 gap-6">
              {/* Grammar Card */}
              <div className="group relative bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] overflow-hidden aspect-video">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--liceu-primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                      Grammar Foundation
                    </div>
                    <div className="text-5xl font-black font-mono text-[var(--liceu-accent)]/20 mt-2">
                      {grammarScore}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                        Mastery
                      </span>
                      <span className="font-[var(--font-space-grotesk)] text-xs font-black text-[var(--liceu-accent)] tabular-nums">
                        {grammarScore}%
                      </span>
                    </div>
                    <div className="h-1 bg-[var(--liceu-surface-container-highest)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--liceu-accent)]"
                        style={{ width: `${grammarScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Rhetoric Card */}
              <div className="group relative bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] overflow-hidden aspect-video">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--liceu-primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                      Rhetoric Craft
                    </div>
                    <div className="text-5xl font-black font-mono text-[var(--liceu-accent)]/20 mt-2">
                      {rhetoricScore}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                        Mastery
                      </span>
                      <span className="font-[var(--font-space-grotesk)] text-xs font-black text-[var(--liceu-accent)] tabular-nums">
                        {rhetoricScore}%
                      </span>
                    </div>
                    <div className="h-1 bg-[var(--liceu-surface-container-highest)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--liceu-secondary)]"
                        style={{ width: `${rhetoricScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Session Monitor */}
          <div className="lg:col-span-4 bg-[var(--liceu-primary)] border border-[var(--liceu-stone)] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--liceu-accent)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--liceu-accent)]" />
                </span>
                <span className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-accent)]">
                  Live Session
                </span>
              </div>
              <div className="bg-[#003823]/50 p-4 space-y-3">
                <div>
                  <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                    Current Module
                  </div>
                  <div className="font-[var(--font-noto-serif)] text-sm font-bold text-[var(--liceu-text)] mt-1">
                    Grammar II — Syntax
                  </div>
                </div>
                <div>
                  <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
                    Active Students
                  </div>
                  <div className="font-[var(--font-space-grotesk)] text-xl font-black text-[var(--liceu-text)] tabular-nums mt-1">
                    {metrics.activeStudents}
                  </div>
                </div>
              </div>
            </div>
            <button className="mt-4 w-full font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-accent)] border border-[var(--liceu-accent)] py-3 hover:bg-[var(--liceu-accent)] hover:text-[var(--liceu-primary)] transition-colors">
              Enter Session
            </button>
          </div>
        </div>
      </section>

      {/* ===== INITIATES UNDER FORGE ===== */}
      <section>
        {/* Section header with tab bar */}
        <div className="mb-6">
          <h2 className="font-[var(--font-noto-serif)] text-xl font-black uppercase tracking-tight text-[var(--liceu-text)] mb-4">
            Initiates Under Forge
          </h2>
          <div className="flex gap-6 border-b border-[var(--liceu-stone)]">
            <button className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-accent)] border-b-2 border-[var(--liceu-accent)] pb-2">
              Active
            </button>
            <button className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] pb-2 hover:text-[var(--liceu-text)] transition-colors">
              Evaluation
            </button>
            <button className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] pb-2 hover:text-[var(--liceu-text)] transition-colors">
              Completed
            </button>
          </div>
        </div>

        {/* Full-width table */}
        <div className="bg-[var(--liceu-surface-container-lowest)] border border-[var(--liceu-stone)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--liceu-surface-container)]">
                <th className="text-left font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] px-4 py-3">
                  ID
                </th>
                <th className="text-left font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] px-4 py-3">
                  Initiate
                </th>
                <th className="text-left font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] px-4 py-3">
                  Module
                </th>
                <th className="text-left font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] px-4 py-3">
                  Status
                </th>
                <th className="text-right font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] px-4 py-3">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-t border-[var(--liceu-stone)] hover:bg-[var(--liceu-surface-container-low)] transition-colors"
                >
                  <td className="px-4 py-3 font-[var(--font-space-grotesk)] text-xs tabular-nums text-[var(--liceu-muted)]">
                    {student.id}
                  </td>
                  <td className="px-4 py-3 font-[var(--font-noto-serif)] text-sm font-bold text-[var(--liceu-text)]">
                    {student.name}
                  </td>
                  <td className="px-4 py-3 font-[var(--font-space-grotesk)] text-xs text-[var(--liceu-muted)]">
                    {student.module}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2 py-1 bg-[var(--liceu-primary)] text-[var(--liceu-accent)] text-[10px] font-[var(--font-space-grotesk)] uppercase tracking-[0.15em]">
                      {student.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-24 h-1 bg-[var(--liceu-surface-container-highest)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--liceu-accent)]"
                          style={{ width: `${student.progress}%` }}
                        />
                      </div>
                      <span className="font-[var(--font-space-grotesk)] text-xs font-black text-[var(--liceu-accent)] tabular-nums min-w-[2.5rem] text-right">
                        {student.progress}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== ORIGINAL CHARTS (preserved but wrapped in verdant styling) ===== */}
      <section>
        <div className="mb-6">
          <h2 className="font-[var(--font-noto-serif)] text-xl font-black uppercase tracking-tight text-[var(--liceu-text)]">
            Activity & System State
          </h2>
          <p className="mt-2 font-[var(--font-space-grotesk)] text-[11px] tracking-[0.15em] text-[var(--liceu-muted)]">
            Global metrics, activity overview, system state. No celebration. Only evidence.
          </p>
        </div>

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
              <div className="font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
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
              <div className="font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
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
              <div className="font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)]">
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
                  className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface-container)] px-4 py-3"
                >
                  <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                    {r.k}
                  </div>
                  <div className="mt-2 font-[var(--font-space-grotesk)] text-[12px] tabular-nums text-[var(--liceu-text)]">
                    {r.v}
                  </div>
                </div>
              ))}
            </div>
          </ChartContainer>
        </div>
      </section>

      {/* ===== BOTTOM ACTION BLOCK ===== */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-[var(--liceu-stone)]">
        {/* Assignment Review */}
        <div className="group flex gap-6">
          <div className="w-32 h-32 bg-[var(--liceu-surface-container-highest)] flex items-center justify-center border-l-4 border-[var(--liceu-secondary)] shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[var(--liceu-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="font-[var(--font-noto-serif)] text-lg font-black uppercase tracking-tight text-[var(--liceu-text)]">
              Assignment Review
            </h3>
            <p className="mt-2 font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)] leading-relaxed">
              Evaluate pending submissions. Approve or return with annotations.
            </p>
            <button className="mt-4 group/btn inline-flex items-center gap-2 font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-accent)] hover:text-[var(--liceu-text)] transition-colors w-fit">
              Review Queue
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mentor Schedule */}
        <div className="group flex gap-6">
          <div className="w-32 h-32 bg-[var(--liceu-surface-container-highest)] flex items-center justify-center border-l-4 border-[var(--liceu-accent)] shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[var(--liceu-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="font-[var(--font-noto-serif)] text-lg font-black uppercase tracking-tight text-[var(--liceu-text)]">
              Mentor Schedule
            </h3>
            <p className="mt-2 font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)] leading-relaxed">
              Configure session blocks, assign cohorts, manage availability.
            </p>
            <button className="mt-4 group/btn inline-flex items-center gap-2 font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-accent)] hover:text-[var(--liceu-text)] transition-colors w-fit">
              Manage Calendar
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
