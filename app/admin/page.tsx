import Link from "next/link";
import { getAdminMetrics, getAdminStudents } from "@/lib/admin/queries";

export const revalidate = 60;

export default async function AdminCommandCenterPage() {
  const metrics = await getAdminMetrics();
  const students = await getAdminStudents();

  return (
    <div className="p-4 md:p-6 space-y-12">
      {/* ===== HERO ===== */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="font-[var(--font-noto-serif)] text-2xl font-black uppercase tracking-tight text-[var(--liceu-text)]">
            Liceu Underground
          </h1>
          <div className="flex gap-4">
            <div className="bg-[var(--liceu-surface-container)] px-4 py-2 border-l-2 border-[var(--liceu-secondary)]">
              <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">Students</div>
              <div className="font-[var(--font-space-grotesk)] text-2xl font-black text-[var(--liceu-text)] tabular-nums">{metrics.activeStudents}</div>
            </div>
            <div className="bg-[var(--liceu-surface-container)] px-4 py-2 border-l-2 border-[var(--liceu-accent)]">
              <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">Modules</div>
              <div className="font-[var(--font-space-grotesk)] text-2xl font-black text-[var(--liceu-text)] tabular-nums">{metrics.totalModules}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <div className="grid grid-cols-2 gap-6">
              <Link href="/admin/content" className="group relative bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] overflow-hidden aspect-video hover:border-[var(--liceu-accent)]/50 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--liceu-primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">Content</div>
                    <div className="text-5xl font-black font-mono text-[var(--liceu-accent)]/20 mt-2">{metrics.totalLessons}</div>
                  </div>
                  <div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="font-[var(--font-space-grotesk)] text-[9px] text-[var(--liceu-muted)]">{metrics.totalLessons} lessons</span>
                      <span className="font-[var(--font-space-grotesk)] text-[9px] text-[var(--liceu-muted)]">·</span>
                      <span className="font-[var(--font-space-grotesk)] text-[9px] text-[var(--liceu-muted)]">{metrics.totalFlashcards} flashcards</span>
                      <span className="font-[var(--font-space-grotesk)] text-[9px] text-[var(--liceu-muted)]">·</span>
                      <span className="font-[var(--font-space-grotesk)] text-[9px] text-[var(--liceu-muted)]">{metrics.totalExercises} exercises</span>
                    </div>
                  </div>
                </div>
              </Link>

              <Link href="/admin/students" className="group relative bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] overflow-hidden aspect-video hover:border-[var(--liceu-accent)]/50 transition-colors">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--liceu-primary)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">Students</div>
                    <div className="text-5xl font-black font-mono text-[var(--liceu-accent)]/20 mt-2">{metrics.activeStudents}</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">Completion</span>
                      <span className="font-[var(--font-space-grotesk)] text-xs font-black text-[var(--liceu-accent)] tabular-nums">{metrics.modulesCompletionRate}%</span>
                    </div>
                    <div className="h-1 bg-[var(--liceu-surface-container-highest)] overflow-hidden">
                      <div className="h-full bg-[var(--liceu-secondary)]" style={{ width: `${metrics.modulesCompletionRate}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-4 bg-[var(--liceu-primary)]/10 border border-[var(--liceu-stone)] p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--liceu-accent)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--liceu-accent)]" />
                </span>
                <span className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-accent)]">System</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Theoretical texts", value: metrics.totalTheoreticalContent },
                  { label: "Simulations", value: metrics.totalSimulations },
                  { label: "Rhetorical excerpts", value: metrics.totalExcerpts },
                ].map(r => (
                  <div key={r.label}>
                    <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">{r.label}</div>
                    <div className="font-[var(--font-space-grotesk)] text-xl font-black text-[var(--liceu-text)] tabular-nums mt-1">{r.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STUDENT TABLE ===== */}
      <section>
        <div className="mb-6">
          <h2 className="font-[var(--font-noto-serif)] text-xl font-black uppercase tracking-tight text-[var(--liceu-text)] mb-4">Students</h2>
          <div className="flex gap-6 border-b border-[var(--liceu-stone)]">
            <button className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-accent)] border-b-2 border-[var(--liceu-accent)] pb-2">All</button>
          </div>
        </div>

        <div className="bg-[var(--liceu-surface-container-lowest)] border border-[var(--liceu-stone)] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--liceu-surface-container)]">
                <th className="text-left font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] px-4 py-3">ID</th>
                <th className="text-left font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] px-4 py-3">Student</th>
                <th className="text-left font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] px-4 py-3">Module</th>
                <th className="text-left font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] px-4 py-3">Status</th>
                <th className="text-left font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] px-4 py-3">Last Active</th>
                <th className="text-right font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)] px-4 py-3">Progress</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center font-[var(--font-space-grotesk)] text-xs uppercase tracking-[0.2em] text-[var(--liceu-muted)]">No students enrolled yet.</td>
                </tr>
              ) : (
                students.map(s => (
                  <tr key={s.id} className="border-t border-[var(--liceu-stone)] hover:bg-[var(--liceu-surface-container-low)] transition-colors">
                    <td className="px-4 py-3 font-[var(--font-space-grotesk)] text-xs tabular-nums text-[var(--liceu-muted)]">{s.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/students/${s.id}`} className="font-[var(--font-inter)] text-sm font-bold text-[var(--liceu-text)] hover:text-[var(--liceu-accent)] underline decoration-[var(--liceu-stone)] underline-offset-4">{s.name}</Link>
                    </td>
                    <td className="px-4 py-3 font-[var(--font-space-grotesk)] text-xs text-[var(--liceu-muted)]">{s.currentModule}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 bg-[var(--liceu-primary)]/10 text-[var(--liceu-accent)] text-[10px] font-[var(--font-space-grotesk)] uppercase tracking-[0.15em]">{s.status}</span>
                    </td>
                    <td className="px-4 py-3 font-[var(--font-space-grotesk)] text-xs text-[var(--liceu-muted)] tabular-nums">{s.lastActivity}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="w-24 h-1 bg-[var(--liceu-surface-container-highest)] overflow-hidden">
                          <div className="h-full bg-[var(--liceu-accent)]" style={{ width: `${s.completionPct}%` }} />
                        </div>
                        <span className="font-[var(--font-space-grotesk)] text-xs font-black text-[var(--liceu-accent)] tabular-nums">{s.completionPct}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ===== QUICK ACTIONS ===== */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-[var(--liceu-stone)]">
        <Link href="/admin/students" className="group flex gap-4 bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] p-5 hover:border-[var(--liceu-accent)]/40 transition-colors">
          <div className="w-12 h-12 bg-[var(--liceu-surface-container-highest)] flex items-center justify-center border-l-2 border-[var(--liceu-secondary)] shrink-0">
            <svg className="w-6 h-6 text-[var(--liceu-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="font-[var(--font-inter)] text-sm font-bold text-[var(--liceu-text)]">Manage Students</h3>
            <p className="font-[var(--font-work-sans)] text-xs text-[var(--liceu-muted)] mt-1">View roster, grant access, track progress</p>
          </div>
        </Link>

        <Link href="/admin/content" className="group flex gap-4 bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] p-5 hover:border-[var(--liceu-accent)]/40 transition-colors">
          <div className="w-12 h-12 bg-[var(--liceu-surface-container-highest)] flex items-center justify-center border-l-2 border-[var(--liceu-accent)] shrink-0">
            <svg className="w-6 h-6 text-[var(--liceu-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="font-[var(--font-inter)] text-sm font-black uppercase text-[var(--liceu-text)]">View Content</h3>
            <p className="font-[var(--font-work-sans)] text-xs text-[var(--liceu-muted)] mt-1">{metrics.totalLessons} lessons · {metrics.totalModules} modules</p>
          </div>
        </Link>

        <Link href="/admin/students/create" className="group flex gap-4 bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] p-5 hover:border-[var(--liceu-accent)]/40 transition-colors">
          <div className="w-12 h-12 bg-[var(--liceu-surface-container-highest)] flex items-center justify-center border-l-2 border-[var(--liceu-primary)] shrink-0">
            <svg className="w-6 h-6 text-[var(--liceu-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="font-[var(--font-inter)] text-sm font-black uppercase text-[var(--liceu-text)]">Create Student</h3>
            <p className="font-[var(--font-work-sans)] text-xs text-[var(--liceu-muted)] mt-1">Add new student accounts</p>
          </div>
        </Link>
      </section>
    </div>
  );
}