"use client";

import { useState } from "react";

function Sidebar({
  user,
  activeNav,
  firstCurrentModule,
  onNavigate,
}: {
  user: { email: string };
  activeNav: string;
  firstCurrentModule: { id: string } | null;
  onNavigate: () => void;
}) {
  const navItems = [
    { id: "overview", label: "Overview", icon: "◈" },
    { id: "courses", label: "Módulos", icon: "◉" },
    { id: "drills", label: "Exercícios", icon: "◆" },
    { id: "logs", label: "Registros", icon: "▣" },
    { id: "mentoring", label: "Mentoria", icon: "◎" },
  ];

  const navHref = (id: string) => {
    if (id === "overview") return "/dashboard";
    if (id === "courses") return "/dashboard";
    if (id === "drills")
      return firstCurrentModule ? `/modules/${firstCurrentModule.id}/flashcards` : "/dashboard";
    if (id === "logs") return "/admin/progress";
    if (id === "mentoring") return "/mentorship";
    return "/dashboard";
  };

  return (
    <aside className="flex h-screen w-64 flex-col bg-[#0E0E0E] shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
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
          const el = (
            <span className="flex w-full items-center gap-3 px-4 py-3 font-mono text-xs uppercase tracking-widest transition-colors">
              <span className="text-sm">{item.icon}</span>
              {item.label}
            </span>
          );
          const activeClass = "bg-[#201F1F] text-[var(--liceu-accent)] border-l-4 border-[var(--liceu-primary)]";
          const inactiveClass =
            "text-[var(--liceu-muted)] border-l-4 border-transparent hover:text-[var(--liceu-text)] hover:bg-[#201F1F]/50";
          const classes = `flex w-full ${isActive ? activeClass : inactiveClass}`;

          return (
            <a key={item.id} href={navHref(item.id)} className={classes} onClick={onNavigate}>
              {el}
            </a>
          );
        })}
      </nav>
      <div className="space-y-3 border-t border-[var(--liceu-stone)]/30 px-4 py-4">
        <a
          href={firstCurrentModule ? `/modules/${firstCurrentModule.id}/flashcards` : "/dashboard"}
          onClick={onNavigate}
          className="w-full rounded border border-[var(--liceu-accent)]/30 bg-[var(--liceu-accent)]/10 px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-[var(--liceu-accent)] hover:bg-[var(--liceu-accent)]/20 transition-colors"
        >
          Iniciar Exercício →
        </a>
        <a
          href="/api/auth/logout"
          onClick={onNavigate}
          className="block text-center font-mono text-[10px] uppercase tracking-widest text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] transition-colors"
        >
          Logout
        </a>
      </div>
    </aside>
  );
}

export function DashboardShell({
  user,
  title,
  activeNav,
  firstCurrentModule,
  children,
}: {
  user: { email: string };
  title: string;
  activeNav: string;
  firstCurrentModule: { id: string } | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      {/* Mobile drawer backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[55] bg-black/60 md:hidden"
          aria-hidden="true"
          onClick={close}
        />
      )}

      {/* Off-canvas drawer on mobile, fixed rail on desktop (original behavior) */}
      <div
        className={`fixed left-0 top-0 z-[60] h-screen w-64 transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <Sidebar
          user={user}
          activeNav={activeNav}
          firstCurrentModule={firstCurrentModule}
          onNavigate={close}
        />
      </div>

      {/* Top app bar — hamburger only on mobile */}
      <header className="h-20 border-l-4 border-[var(--liceu-accent)] bg-[var(--liceu-surface)] flex items-center justify-between px-4 md:px-8 md:ml-64">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Abrir menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="flex h-9 w-9 items-center justify-center border border-[var(--liceu-stone)] text-[var(--liceu-accent)] md:hidden"
          >
            <span className="font-[var(--font-space-grotesk)] text-lg leading-none">≡</span>
          </button>
          <div>
            <h1 className="font-[var(--font-noto-serif)] text-2xl text-[var(--liceu-text)]">
              {title}
            </h1>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--liceu-muted)]">
              The Training Grounds
            </div>
          </div>
        </div>
      </header>

      {children}
    </>
  );
}
