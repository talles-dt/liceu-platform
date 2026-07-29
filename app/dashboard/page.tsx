import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";
import { getCommerceConfig } from "@/lib/commerce";
import { ModuleList, type ModuleListItem } from "@/components/ModuleList";
import { PurchaseToast } from "@/components/PurchaseToast";

export const revalidate = 60;

type DashboardSearchParams = { purchase?: string };

type DbModule = { id: string; code: string; title: string; subtitle: string; description: string; order_index: number; estimated_hours: number; is_active: boolean };
type DbLesson = { id: string; module_id: string; code: string; title: string; subtitle: string; order_index: number; difficulty_tier: number; estimated_minutes: number; is_published: boolean };
type DbProgression = { current_module_id: string | null; current_lesson_id: string | null; completed_lessons: string[]; completed_exercises: string[]; completed_simulations: string[]; maturity_stage: string; total_study_minutes: number };

async function loadDashboardData(userId: string) {
  const supabase = await createSupabaseServerClient();

  const [{ data: modulesData }, { data: lessonsData }, { data: progData }] = await Promise.all([
    supabase.from("liceu_modules").select("id, code, title, subtitle, description, order_index, estimated_hours, is_active").eq("is_active", true).order("order_index"),
    supabase.from("liceu_lessons").select("id, module_id, code, title, subtitle, order_index, difficulty_tier, estimated_minutes, is_published").eq("is_published", true).order("order_index"),
    supabase.from("liceu_learner_progression").select("current_module_id, current_lesson_id, completed_lessons, completed_exercises, completed_simulations, maturity_stage, total_study_minutes").eq("user_id", userId).maybeSingle(),
  ]);

  const modules = (modulesData as DbModule[]) ?? [];
  const lessons = (lessonsData as DbLesson[]) ?? [];
  const prog = (progData as DbProgression) ?? null;

  if (modules.length === 0) return { modules: [], courseViews: [], prog, totalCompleted: 0, totalModules: 0, overallPercent: 0 };

  // Group lessons by module
  const lessonsByModule = new Map<string, DbLesson[]>();
  for (const l of lessons) {
    const arr = lessonsByModule.get(l.module_id) ?? [];
    arr.push(l);
    lessonsByModule.set(l.module_id, arr);
  }

  const completedSet = new Set(prog?.completed_lessons ?? []);

  // Build per-module view data (each module acts as a "course" in the dashboard)
  const courseViews = modules.map((mod) => {
    const modLessons = (lessonsByModule.get(mod.id) ?? []).sort((a, b) => a.order_index - b.order_index);

    const moduleItems: ModuleListItem[] = modLessons.map((l, i) => {
      const completed = completedSet.has(l.id);
      const isCurrentLesson = prog?.current_lesson_id === l.id;
      // First incomplete lesson (or the one user is on) is "current", all before are "completed", all after are "locked"
      let status: ModuleListItem["status"] = "locked";
      if (completed) {
        status = "completed";
      } else if (isCurrentLesson || i === 0) {
        status = "current";
      } else {
        // Check if previous lesson is completed
        const prevLesson = i > 0 ? modLessons[i - 1] : null;
        if (prevLesson && completedSet.has(prevLesson.id)) {
          status = "current";
        }
      }
      return { id: l.id, title: l.title, href: `/modules/${mod.id}/lessons/${l.id}`, status };
    });

    const completedCount = moduleItems.filter((m) => m.status === "completed").length;
    const totalCount = modLessons.length;
    const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
    const currentModule = moduleItems.find((i) => i.status === "current") ?? moduleItems[0];

    return {
      course: { id: mod.id, code: mod.code, title: mod.title, subtitle: mod.subtitle, modules: modLessons },
      moduleItems,
      completedCount,
      totalCount,
      percent,
      currentModule,
    };
  });

  const totalCompleted = courseViews.reduce((s, cv) => s + cv.completedCount, 0);
  const totalModules = courseViews.reduce((s, cv) => s + cv.totalCount, 0);
  const overallPercent = totalModules === 0 ? 0 : Math.round((totalCompleted / totalModules) * 100);

  return { modules, courseViews, prog, totalCompleted, totalModules, overallPercent };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Sidebar({ user, activeNav }: { user: { email: string }; activeNav: string }) {
  const navItems = [
    { id: "overview", label: "Overview", icon: "◈" },
    { id: "courses", label: "Módulos", icon: "◉" },
    { id: "drills", label: "Exercícios", icon: "◆" },
    { id: "logs", label: "Registros", icon: "▣" },
    { id: "mentoring", label: "Mentoria", icon: "◎" },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#0E0E0E] shadow-[20px_0_50px_rgba(0,0,0,0.5)] flex flex-col">
      <div className="px-5 pt-6 pb-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--liceu-secondary)]">
          Archive
        </div>
      </div>
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
      <nav className="flex-1 px-0 py-2">
        {navItems.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              className={`flex w-full items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-widest transition-colors
                ${isActive
                  ? "bg-[#201F1F] text-[var(--liceu-accent)] border-l-4 border-[var(--liceu-primary)]"
                  : "text-[var(--liceu-muted)] border-l-4 border-transparent hover:text-[var(--liceu-text)] hover:bg-[#201F1F]/50"
                }`}
            >
              <span className="text-sm">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="border-t border-[var(--liceu-stone)]/30 px-4 py-4 space-y-3">
        <button className="w-full rounded border border-[var(--liceu-accent)]/30 bg-[var(--liceu-accent)]/10 px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-[var(--liceu-accent)] hover:bg-[var(--liceu-accent)]/20 transition-colors">
          Iniciar Exercício →
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
          {completedCount} of {totalCount} lessons completed
        </div>
        {currentModule && (
          <div className="mt-4 font-[var(--font-work-sans)] text-xs text-[var(--liceu-text)]">
            Current: <span className="text-[var(--liceu-accent)]">{currentModule.title}</span>
          </div>
        )}
      </div>
      <div className="lg:col-span-4 bg-[var(--liceu-primary)]/20 p-10 border-l border-[var(--liceu-stone)]/30 flex flex-col justify-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--liceu-secondary)]">
          Next Milestone
        </div>
        <div className="mt-4 font-[var(--font-noto-serif)] text-xl text-[var(--liceu-text)] leading-snug">
          {currentModule
            ? `Complete "${currentModule.title}" to advance clearance.`
            : "All lessons complete. Awaiting review."}
        </div>
        <div className="mt-6 font-mono text-xs text-[var(--liceu-muted)]">
          {totalCount - completedCount} lesson{totalCount - completedCount === 1 ? "" : "s"} remaining
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

function RhetoricalTrendsChart({ courseViews }: {
  courseViews: Array<{ course: { id: string; code: string; title: string; subtitle?: string }; completedCount: number; totalCount: number; percent: number }>;
}) {
  const maxVal = Math.max(...courseViews.map((c) => c.totalCount), 1);

  return (
    <div className="bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)]/20 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--liceu-muted)]">
            Rhetorical PR Trends
          </div>
          <div className="mt-1 font-[var(--font-noto-serif)] text-xl text-[var(--liceu-text)]">
            Module Progression
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
                {cv.course.code}. {cv.course.title}
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
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60">
                <span className="font-mono text-[10px] text-white">
                  {cv.completedCount}/{cv.totalCount} lessons
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionLogs({ completedCount, totalCount, courseViews }: {
  completedCount: number;
  totalCount: number;
  courseViews: Array<{ completedCount: number; totalCount: number; course: { title: string } }>;
}) {
  const logEntries = [
    { prefix: "[SYNC]", prefixColor: "text-[var(--liceu-accent)]", text: `Cognitive sync complete — ${completedCount} lessons processed` },
    { prefix: "[CURR]", prefixColor: "text-[var(--liceu-secondary)]", text: `${courseViews.length} module(s) in active rotation` },
    { prefix: "[DATA]", prefixColor: "text-[var(--liceu-secondary)]", text: `No exercises submitted yet` },
    { prefix: "[WARN]", prefixColor: "text-[var(--liceu-critical)]", text: `${totalCount - completedCount} lesson(s) remaining` },
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
            <span className={`${entry.prefixColor} whitespace-nowrap`}>{entry.prefix}</span>
            <span className="text-[var(--liceu-muted)]">
              {new Date().toLocaleTimeString("en-US", { hour12: false })}
            </span>
            <span className="text-[var(--liceu-text)]">{entry.text}</span>
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

function ActiveDrills({ remainingCount }: { remainingCount: number }) {
  const drills = [
    {
      icon: "◈",
      complexity: "Intermediate",
      complexityColor: "text-[var(--liceu-secondary)]",
      title: "Module Drills",
      description: `Practice ${remainingCount} remaining lesson${remainingCount !== 1 ? "s" : ""} to advance clearance level.`,
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
      description: "Complete modules to unlock mentoring access and schedule your session.",
      action: "Locked",
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

// ─── Main Page ────────────────────────────────────────────────────────────────

export default async function DashboardPage(props: { searchParams: Promise<DashboardSearchParams> }) {
  const searchParams = await props.searchParams;
  if (searchParams.purchase === "success") {
    redirect("/onboarding");
  }

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { courseViews, prog, totalCompleted, totalModules, overallPercent } = await loadDashboardData(user.id);
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
  const mentorshipModuleUnlocked = totalCompleted >= 7; // Unlock after first module's lessons

  const firstCurrentModule = courseViews.map((cv) => cv.currentModule).find((m) => m && m.status !== "completed") ?? null;

  return (
    <>
      <Suspense>
        <PurchaseToast />
      </Suspense>

      <div className="min-h-screen bg-[var(--liceu-surface-container-low)] pb-8">
        <Sidebar user={{ email: user.email ?? "user" }} activeNav="overview" />

        <TopAppBar title="Liceu Underground" />

        <main className="ml-64 min-h-screen">
          <IntellectualLoadHero
            percent={overallPercent}
            completedCount={totalCompleted}
            totalCount={totalModules}
            currentModule={firstCurrentModule}
          />

          <div className="lg:grid lg:grid-cols-12 gap-8 mt-8 px-8">
            <div className="lg:col-span-7">
              <RhetoricalTrendsChart courseViews={courseViews} />
            </div>
            <div className="lg:col-span-5 mt-8 lg:mt-0">
              <SessionLogs completedCount={totalCompleted} totalCount={totalModules} courseViews={courseViews} />
            </div>
          </div>

          <div className="px-8">
            <ActiveDrills remainingCount={totalModules - totalCompleted} />
          </div>

          {/* Module detail sections */}
          {courseViews.length > 0 && (
            <div className="px-8 mt-12 space-y-12">
              {courseViews.map(({ course, moduleItems, completedCount, totalCount, percent, currentModule }) => (
                <section key={course.id} className="space-y-6">
                  <div className="flex items-end justify-between gap-6 border-b border-[var(--liceu-stone)]/40 pb-4">
                    <div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                        {course.code}
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
                        {completedCount} / {totalCount} lessons
                      </div>
                    </div>
                  </div>

                  {currentModule && currentModule.status !== "completed" && (
                    <div className="space-y-2">
                      <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                        CURRENT LESSON
                      </div>
                      <div className="font-[var(--font-noto-serif)] text-xl leading-tight text-[var(--liceu-text)]">
                        {currentModule.title}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                      LESSONS
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

          {courseViews.length === 0 && (
            <div className="px-8 mt-12">
              <p className="font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)]">
                Nenhum módulo disponível para esta conta.
              </p>
            </div>
          )}
        </main>

        <BottomStatusBar />
      </div>
    </>
  );
}