import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { Course, Module, ModuleProgress } from "@/lib/domain";
import { canAccessModule } from "@/lib/domain";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";
import { ModuleList, type ModuleListItem } from "@/components/ModuleList";
import { getCommerceConfig } from "@/lib/commerce";
import { PurchaseToast } from "@/components/PurchaseToast";

export const revalidate = 60;

type DbCourseRow = {
  id: string;
  title: string;
};

type DbModuleRow = {
  id: string;
  course_id: string;
  order_index: number;
  title: string;
};

type DbModuleProgressRow = {
  module_id: string;
  completed: boolean;
  quiz_score: number | null;
  assignment_submitted: boolean;
  mentorship_unlocked: boolean;
};

async function loadDashboardData(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: progressData } = await supabase
    .from("module_progress")
    .select(
      "module_id, completed, quiz_score, assignment_submitted, mentorship_unlocked",
    )
    .eq("user_id", userId);

  const progress: ModuleProgress[] =
    progressData?.map((p: DbModuleProgressRow) => ({
      moduleId: p.module_id,
      completed: p.completed,
      quizScore: p.quiz_score,
      assignmentApproved: p.assignment_submitted,
      mentorshipUnlocked: p.mentorship_unlocked,
    })) ?? [];

  if (progress.length === 0) {
    return { courses: [], progress };
  }

  const purchasedModuleIds = progress.map((p) => p.moduleId);

  const { data: modulesData } = await supabase
    .from("modules")
    .select("id, course_id, order_index, title")
    .in("id", purchasedModuleIds)
    .order("course_id")
    .order("order_index", { ascending: true });

  const modules: Module[] =
    modulesData?.map((m: DbModuleRow) => ({
      id: m.id,
      courseId: m.course_id,
      index: m.order_index,
      title: m.title,
    })) ?? [];

  const purchasedCourseIds = [...new Set(modules.map((m) => m.courseId))];

  const { data: coursesData } = await supabase
    .from("courses")
    .select("id, title")
    .in("id", purchasedCourseIds);

  const courseTitleById = new Map<string, string>(
    (coursesData as DbCourseRow[] ?? []).map((c) => [c.id, c.title]),
  );

  const coursesById = new Map<string, Course>();
  for (const mod of modules) {
    if (!coursesById.has(mod.courseId)) {
      coursesById.set(mod.courseId, {
        id: mod.courseId,
        title: courseTitleById.get(mod.courseId) ?? `Curso ${mod.courseId.slice(0, 8)}`,
        modules: [],
      });
    }
    coursesById.get(mod.courseId)!.modules.push(mod);
  }

  return {
    courses: Array.from(coursesById.values()).map((course) => ({
      ...course,
      modules: course.modules.sort((a, b) => a.index - b.index),
    })),
    progress,
  };
}

// --- Sub-components ---

function Sidebar({ user, activeNav }: { user: { email: string }; activeNav: string }) {
  const navItems = [
    { id: "overview", label: "Overview", icon: "◈" },
    { id: "courses", label: "Courses", icon: "◉" },
    { id: "drills", label: "Drills", icon: "◆" },
    { id: "logs", label: "Session Logs", icon: "▣" },
    { id: "mentoring", label: "Mentoring", icon: "◎" },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#0E0E0E] shadow-[20px_0_50px_rgba(0,0,0,0.5)] flex flex-col">
      {/* Top label */}
      <div className="px-5 pt-6 pb-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--liceu-secondary)]">
          Archive
        </div>
      </div>

      {/* Profile card */}
      <div className="mx-4 mb-4 flex items-center gap-3 rounded border border-[var(--liceu-stone)]/30 bg-[#201F1F]/60 px-3 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--liceu-primary)]/40 font-mono text-xs text-[var(--liceu-accent)]">
          {user.email?.charAt(0).toUpperCase() ?? "U"}
        </div>
        <div className="min-w-0">
          <div className="truncate font-[var(--font-work-sans)] text-xs text-[var(--liceu-text)]">
            {user.email}
          </div>
          <div className="font-mono text-[10px] text-[var(--liceu-muted)]">
            Clearance: Active
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-0 py-2">
        {navItems.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <a
              key={item.id}
              href="#"
              className={`flex items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-widest transition-colors
                ${isActive
                  ? "bg-[#201F1F] text-[var(--liceu-accent)] border-l-4 border-[var(--liceu-primary)]"
                  : "text-[var(--liceu-muted)] border-l-4 border-transparent hover:text-[var(--liceu-text)] hover:bg-[#201F1F]/50"
                }`}
            >
              <span className="text-sm">{item.icon}</span>
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-[var(--liceu-stone)]/30 px-4 py-4 space-y-3">
        <button className="w-full rounded border border-[var(--liceu-accent)]/30 bg-[var(--liceu-accent)]/10 px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-[var(--liceu-accent)] hover:bg-[var(--liceu-accent)]/20 transition-colors">
          Begin Drill →
        </button>
        <a
          href="/api/auth/logout"
          className="block text-center font-mono text-[10px] uppercase tracking-widest text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] transition-colors"
        >
          Logout
        </a>
      </div>
    </aside>
  );
}

function TopAppBar({ title }: { title: string }) {
  return (
    <header className="ml-64 h-20 bg-[var(--liceu-surface)] border-l-4 border-[var(--liceu-accent)] flex items-center justify-between px-8">
      <div>
        <h1 className="font-[var(--font-noto-serif)] text-2xl text-[var(--liceu-text)]">
          {title}
        </h1>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
          The Training Grounds
        </div>
      </div>
      <nav className="flex items-center gap-6">
        <a href="#" className="font-mono text-xs uppercase tracking-widest text-[var(--liceu-muted)] hover:text-[var(--liceu-accent)] transition-colors">
          Archives
        </a>
        <a href="#" className="font-mono text-xs uppercase tracking-widest text-[var(--liceu-muted)] hover:text-[var(--liceu-accent)] transition-colors">
          Codex
        </a>
        <a href="#" className="font-mono text-xs uppercase tracking-widest text-[var(--liceu-muted)] hover:text-[var(--liceu-accent)] transition-colors">
          Protocol
        </a>
      </nav>
    </header>
  );
}

function IntellectualLoadHero({ percent, completedCount, totalCount, currentModule }: {
  percent: number;
  completedCount: number;
  totalCount: number;
  currentModule: ModuleListItem | null;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-l-4 border-[var(--liceu-accent)] bg-[var(--liceu-surface-container-low)]">
      {/* Left: progress */}
      <div className="lg:col-span-8 p-10 lg:p-12">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--liceu-muted)]">
          Intellectual Load
        </div>
        <h2 className="mt-2 font-[var(--font-noto-serif)] text-3xl text-[var(--liceu-text)]">
          Cognitive Progress
        </h2>
        <div className="mt-6 font-[var(--font-noto-serif)] text-7xl text-[var(--liceu-accent)] leading-none">
          {percent}%
        </div>
        <div className="mt-4 h-12 bg-[var(--liceu-surface-container-highest)] rounded overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--liceu-primary)] to-[var(--liceu-accent)] rounded transition-all duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-3 font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)]">
          {completedCount} of {totalCount} modules completed
        </div>
        {currentModule && (
          <div className="mt-4 font-[var(--font-work-sans)] text-xs text-[var(--liceu-text)]">
            Current: <span className="text-[var(--liceu-accent)]">{currentModule.title}</span>
          </div>
        )}
      </div>

      {/* Right: milestone */}
      <div className="lg:col-span-4 bg-[var(--liceu-primary)]/20 p-10 border-l border-[var(--liceu-stone)]/30 flex flex-col justify-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--liceu-secondary)]">
          Next Milestone
        </div>
        <div className="mt-4 font-[var(--font-noto-serif)] text-xl text-[var(--liceu-text)] leading-snug">
          {currentModule
            ? `Complete "${currentModule.title}" to advance clearance.`
            : "All modules complete. Awaiting review."}
        </div>
        <div className="mt-6 font-mono text-xs text-[var(--liceu-muted)]">
          {totalCount - completedCount} module{totalCount - completedCount !== 1 ? "s" : ""} remaining
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[var(--liceu-accent)] animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--liceu-accent)]">
            Active
          </span>
        </div>
      </div>
    </div>
  );
}

function RhetoricalTrendsChart({ courseViews }: { courseViews: Array<{ course: Course; completedCount: number; totalCount: number; percent: number }> }) {
  const maxVal = Math.max(...courseViews.map((c) => c.totalCount), 1);

  return (
    <div className="bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)]/20 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--liceu-muted)]">
            Rhetorical PR Trends
          </div>
          <div className="mt-1 font-[var(--font-noto-serif)] text-xl text-[var(--liceu-text)]">
            Course Progression
          </div>
        </div>
        <div className="font-mono text-[10px] text-[var(--liceu-muted)]">
          {courseViews.length} active
        </div>
      </div>

      <div className="space-y-5">
        {courseViews.map((cv) => (
          <div key={cv.course.id} className="group">
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-[var(--font-work-sans)] text-xs text-[var(--liceu-text)] truncate max-w-[200px]">
                {cv.course.title}
              </span>
              <span className="font-mono text-xs text-[var(--liceu-accent)] ml-4">
                {cv.percent}%
              </span>
            </div>
            <div className="relative h-8 bg-[var(--liceu-surface-container-highest)] rounded overflow-hidden">
              <div
                className="h-full bg-[var(--liceu-primary)] rounded transition-all duration-500 group-hover:bg-[var(--liceu-accent)]"
                style={{ width: `${(cv.completedCount / maxVal) * 100}%` }}
              />
              {/* Hover tooltip */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60">
                <span className="font-mono text-[10px] text-white">
                  {cv.completedCount}/{cv.totalCount} modules
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionLogs({ progress, courses }: { progress: ModuleProgress[]; courses: Course[] }) {
  // Build log entries from progress data
  const totalCompleted = progress.filter((p) => p.completed).length;
  const totalQuizzes = progress.filter((p) => p.quizScore !== null).length;
  const totalAssignments = progress.filter((p) => p.assignmentApproved).length;
  const avgScore = totalQuizzes > 0
    ? Math.round(progress.reduce((sum, p) => sum + (p.quizScore ?? 0), 0) / totalQuizzes)
    : null;

  const logEntries = [
    { prefix: "[SYNC]", prefixColor: "text-[var(--liceu-accent)]", text: `Cognitive sync complete — ${totalCompleted} modules processed` },
    { prefix: "[QUIZ]", prefixColor: "text-[var(--liceu-secondary)]", text: avgScore !== null ? `Average score: ${avgScore}% across ${totalQuizzes} assessments` : "No assessments recorded" },
    { prefix: "[WRITE]", prefixColor: "text-[var(--liceu-secondary)]", text: `${totalAssignments} submission${totalAssignments !== 1 ? "s" : ""} approved` },
    { prefix: "[WARN]", prefixColor: "text-[var(--liceu-critical)]", text: `${courses.length} course${courses.length !== 1 ? "s" : ""} in active rotation` },
    { prefix: "[SYS]", prefixColor: "text-[var(--liceu-muted)]", text: `Session initialized — ${new Date().toISOString().split("T")[0]}` },
  ];

  return (
    <div className="bg-[#0E0E0E] border border-[var(--liceu-stone)]/20 p-8 font-mono text-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--liceu-muted)]">
          Session Logs
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[var(--liceu-accent)] animate-pulse" />
          <span className="text-[var(--liceu-accent)]">LIVE</span>
        </div>
      </div>

      <div className="space-y-2">
        {logEntries.map((entry, i) => (
          <div key={i} className="flex items-start gap-2 py-1.5 border-b border-[var(--liceu-stone)]/10 last:border-b-0">
            <span className={`${entry.prefixColor} whitespace-nowrap`}>
              {entry.prefix}
            </span>
            <span className="text-[var(--liceu-muted)]">
              {new Date().toLocaleTimeString("en-US", { hour12: false })}
            </span>
            <span className="text-[var(--liceu-text)]">
              {entry.text}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1 pt-2">
          <span className="text-[var(--liceu-accent)]">❯</span>
          <span className="animate-pulse text-[var(--liceu-accent)]">█</span>
        </div>
      </div>
    </div>
  );
}

function ActiveDrills({ courses, progress }: { courses: Course[]; progress: ModuleProgress[] }) {
  const totalModules = courses.reduce((sum, c) => sum + c.modules.length, 0);
  const completedModules = progress.filter((p) => p.completed).length;
  const remainingModules = totalModules - completedModules;

  const drills = [
    {
      icon: "◈",
      complexity: "Intermediate",
      complexityColor: "text-[var(--liceu-secondary)]",
      title: "Module Drills",
      description: `Practice ${remainingModules} remaining module${remainingModules !== 1 ? "s" : ""} to advance clearance level.`,
      action: "Start Drill",
      href: "#",
    },
    {
      icon: "◆",
      complexity: "Advanced",
      complexityColor: "text-[var(--liceu-critical)]",
      title: "Writing Forge",
      description: "Refine your written production. Submit essays for review and improve your analytical precision.",
      action: "Enter Forge",
      href: "#",
    },
    {
      icon: "◎",
      complexity: "Expert",
      complexityColor: "text-[var(--liceu-accent)]",
      title: "Mentoring Arena",
      description: progress.some((p) => p.mentorshipUnlocked)
        ? "Your mentoring session is unlocked. Schedule a live review with an experienced operator."
        : "Complete a module to unlock mentoring access and schedule your session.",
      action: progress.some((p) => p.mentorshipUnlocked) ? "Schedule Session" : "Locked",
      href: "#",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
      {drills.map((drill) => (
        <div
          key={drill.title}
          className="h-80 bg-[var(--liceu-surface-container)] hover:bg-[var(--liceu-surface-container-high)] border border-[var(--liceu-stone)]/20 p-8 flex flex-col justify-between transition-colors"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-2xl text-[var(--liceu-accent)]">{drill.icon}</span>
              <span className={`font-mono text-[10px] uppercase tracking-widest ${drill.complexityColor}`}>
                {drill.complexity}
              </span>
            </div>
            <h3 className="mt-4 font-[var(--font-noto-serif)] text-2xl text-[var(--liceu-text)]">
              {drill.title}
            </h3>
            <p className="mt-3 font-[var(--font-work-sans)] text-sm leading-relaxed text-[var(--liceu-muted)]">
              {drill.description}
            </p>
          </div>
          <a
            href={drill.href}
            className="inline-block w-full text-center border border-[var(--liceu-accent)]/20 px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-[var(--liceu-accent)] hover:bg-[var(--liceu-accent)] transition-colors rounded"
          >
            {drill.action}
          </a>
        </div>
      ))}
    </div>
  );
}

function BottomStatusBar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-8 bg-[var(--liceu-surface)] border-t border-[var(--liceu-stone)]/20 flex items-center px-6 font-mono text-[10px] uppercase tracking-widest text-[var(--liceu-muted)]">
      <span className="ml-auto flex items-center gap-1">
        <span className="animate-pulse text-[var(--liceu-accent)]">_</span>
      </span>
    </div>
  );
}

// --- Main Page ---

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { courses, progress } = await loadDashboardData(user.id);
  const { calInterviewLink, calMentoringLink } = getCommerceConfig();

  const supabase = await createSupabaseServerClient();
  const { data: applicationData } = await supabase
    .from("mentoring_applications")
    .select("status")
    .eq("email", (user.email ?? "").toLowerCase())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const mentoringStatus = (applicationData as { status?: string } | null)?.status ?? null;
  const mentorshipModuleUnlocked = progress.some((p) => p.mentorshipUnlocked);
  const mentorshipAvailable = mentorshipModuleUnlocked;

  // Build per-course view data
  const courseViews = courses.map((course) => {
    const orderedModules = course.modules;

    const moduleItems: ModuleListItem[] = orderedModules.map((m) => {
      const p =
        progress.find((mp) => mp.moduleId === m.id) ??
        ({
          moduleId: m.id,
          completed: false,
          quizScore: null,
          assignmentApproved: false,
          mentorshipUnlocked: false,
        } satisfies ModuleProgress);

      const accessible = canAccessModule(m, orderedModules, progress);
      const status: ModuleListItem["status"] = p.completed
        ? "completed"
        : accessible
          ? "current"
          : "locked";

      return { id: m.id, title: m.title, href: `/modules/${m.id}`, status };
    });

    const completedCount = orderedModules.filter((m) =>
      progress.find((p) => p.moduleId === m.id)?.completed,
    ).length;
    const totalCount = orderedModules.length;
    const percent =
      totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
    const currentModule =
      moduleItems.find((i) => i.status === "current") ??
      moduleItems.find((i) => i.status !== "locked") ??
      moduleItems[0];

    return { course, moduleItems, completedCount, totalCount, percent, currentModule };
  });

  const totalCompleted = courseViews.reduce((s, cv) => s + cv.completedCount, 0);
  const totalModules = courseViews.reduce((s, cv) => s + cv.totalCount, 0);
  const overallPercent = totalModules === 0 ? 0 : Math.round((totalCompleted / totalModules) * 100);
  const firstCurrentModule = courseViews.map((cv) => cv.currentModule).find((m) => m && m.status !== "completed") ?? null;

  return (
    <>
      <Suspense>
        <PurchaseToast />
      </Suspense>

      <div className="min-h-screen bg-[var(--liceu-surface-container-low)] pb-8">
        {/* Fixed Left Sidebar */}
        <Sidebar
          user={{ email: user.email ?? "user" }}
          activeNav="overview"
        />

        {/* Top App Bar */}
        <TopAppBar title="Liceu Underground" />

        {/* Main Content */}
        <main className="ml-64 min-h-screen">
          {/* Intellectual Load Hero */}
          <IntellectualLoadHero
            percent={overallPercent}
            completedCount={totalCompleted}
            totalCount={totalModules}
            currentModule={firstCurrentModule}
          />

          {/* Two-Column Grid */}
          <div className="lg:grid lg:grid-cols-12 gap-8 mt-8 px-8">
            <div className="lg:col-span-7">
              <RhetoricalTrendsChart courseViews={courseViews} />
            </div>
            <div className="lg:col-span-5 mt-8 lg:mt-0">
              <SessionLogs progress={progress} courses={courses} />
            </div>
          </div>

          {/* Active Drills */}
          <div className="px-8">
            <ActiveDrills courses={courses} progress={progress} />
          </div>

          {/* Course detail sections */}
          {courseViews.length > 0 && (
            <div className="px-8 mt-12 space-y-12">
              {courseViews.map(({ course, moduleItems, completedCount, totalCount, percent, currentModule }) => (
                <section key={course.id} className="space-y-6">
                  <div className="flex items-end justify-between gap-6 border-b border-[var(--liceu-stone)]/40 pb-4">
                    <div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                        CURSO
                      </div>
                      <div className="mt-1 font-[var(--font-noto-serif)] text-[22px] leading-tight text-[var(--liceu-text)]">
                        {course.title}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-[var(--font-noto-serif)] text-2xl text-[var(--liceu-text)]">
                        {percent}%
                      </div>
                      <div className="font-[var(--font-work-sans)] text-xs text-[var(--liceu-muted)]">
                        {completedCount} / {totalCount} modules
                      </div>
                    </div>
                  </div>

                  {currentModule && currentModule.status !== "completed" && (
                    <div className="space-y-2">
                      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                        CURRENT MODULE
                      </div>
                      <div className="font-[var(--font-noto-serif)] text-xl leading-tight text-[var(--liceu-text)]">
                        {currentModule.title}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                      MODULES
                    </div>
                    <ModuleList items={moduleItems} />
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Mentoring section */}
          {(mentoringStatus || mentorshipModuleUnlocked) && (
            <div className="px-8 mt-12 pt-8 border-t border-[var(--liceu-stone)]/30 space-y-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                MENTORIA
              </div>

              {mentoringStatus === "pending_interview" && calInterviewLink && (
                <div className="border border-[var(--liceu-stone)]/30 bg-[var(--liceu-surface)]/35 px-5 py-5">
                  <div className="font-[var(--font-noto-serif)] text-[17px] text-[var(--liceu-text)]">
                    Entrevista de qualificação
                  </div>
                  <p className="mt-2 font-[var(--font-work-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
                    Seu pagamento foi confirmado. Agende a entrevista no horário disponível.
                  </p>
                  <a
                    href={calInterviewLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block border border-[var(--liceu-text)] px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-text)] hover:bg-[var(--liceu-surface)]/40"
                  >
                    Agendar entrevista →
                  </a>
                </div>
              )}

              {mentoringStatus === "approved_pending_payment" && (
                <div className="border border-[var(--liceu-secondary)]/30 bg-[var(--liceu-surface)]/35 px-5 py-5">
                  <div className="font-[var(--font-noto-serif)] text-[17px] text-[var(--liceu-text)]">
                    Aprovado para o programa
                  </div>
                  <p className="mt-2 font-[var(--font-work-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
                    Você foi aprovado. Verifique seu email para o link de pagamento com o crédito da entrevista aplicado.
                  </p>
                </div>
              )}

              {mentoringStatus === "active" && calMentoringLink && (
                <div className="border border-[var(--liceu-secondary)]/30 bg-[var(--liceu-surface)]/35 px-5 py-5">
                  <div className="font-[var(--font-noto-serif)] text-[17px] text-[var(--liceu-text)]">
                    Programa de mentoria ativo
                  </div>
                  <p className="mt-2 font-[var(--font-work-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
                    As sessões são liberadas conforme você conclui os módulos. Agende quando estiver pronto.
                  </p>
                  {mentorshipModuleUnlocked && (
                    <a
                      href={calMentoringLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block border border-[var(--liceu-secondary)]/60 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--liceu-secondary)] hover:bg-[var(--liceu-secondary)]/10"
                    >
                      Agendar sessão →
                    </a>
                  )}
                  {!mentorshipModuleUnlocked && (
                    <p className="mt-3 font-[var(--font-work-sans)] text-[11px] text-[var(--liceu-muted)]">
                      Conclua o próximo módulo para liberar o agendamento.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {courses.length === 0 && (
            <div className="px-8 mt-12">
              <p className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)]">
                Nenhum curso foi atribuído a esta conta.
              </p>
            </div>
          )}
        </main>

        {/* Bottom Status Bar */}
        <BottomStatusBar />
      </div>
    </>
  );
}
