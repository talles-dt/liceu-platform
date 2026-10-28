import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getCurrentUser } from "@/lib/supabaseServer";
import { assertAdmin } from "@/lib/admin/auth";

const NAV = [
  { href: "/admin/operacoes" as const, label: "operações" },
  { href: "/admin" as const, label: "visão geral" },
  { href: "/admin/students" as const, label: "alunos e acessos" },
  { href: "/admin/students/create" as const, label: "criar aluno" },
  { href: "/admin/formations" as const, label: "formação" },
  { href: "/admin/progress" as const, label: "acompanhamento" },
  { href: "/admin/assignments" as const, label: "entregas avulsas" },
  { href: "/admin/mentorship" as const, label: "mentoria" },
  { href: "/admin/content" as const, label: "conteúdo de estudo" },
  { href: "/admin/system" as const, label: "sistema e auditoria" },
] as const satisfies ReadonlyArray<{ readonly href: string; readonly label: string }>;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Detect if we're on the admin login page. It must render without the
  // auth-gated sidebar so that unauthenticated admins can reach the form.
  const pathname = (await headers()).get("x-pathname") || "";
  const isLoginPage = pathname === "/admin/login";

  // ── ADMIN LOGIN PAGE (exempt from auth-redirect) ──
  if (isLoginPage) {
    // Unauthenticated users may enter; authenticated users too (no-op pass-through)
    return children;
  }

  // ── ALL OTHER /admin/* ROUTES ──
  if (!user) redirect("/login");

  const admin = await assertAdmin();

  // Final check
  if (!admin) {
    return (
      <main className="mx-auto max-w-xl space-y-5 px-6 py-16">
        <h1 className="text-2xl font-serif">Acesso administrativo não disponível</h1>
        <p>Você está conectado, mas não foi possível confirmar a permissão administrativa desta conta.</p>
        <p>Se você já é administrador, tente novamente. Se o problema continuar, solicite a revisão do seu acesso.</p>
        <Link href="/dashboard" className="block underline">Ir para meus espaços</Link>
        <Link href="/admin/login" className="block underline">Entrar com outra conta</Link>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--liceu-bg)] text-[var(--liceu-text)]">
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-4 md:px-6 md:py-6">
        <div className="grid min-h-[calc(100vh-3rem)] grid-cols-1 gap-4 md:grid-cols-[260px_1fr] md:gap-6">
          <aside className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface-raised)] shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
            <div className="border-b border-[var(--liceu-stone)] border-l-4 border-l-[var(--liceu-accent)] px-4 py-4">
              <div className="font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em] text-[var(--liceu-accent)]">
                Liceu / Admin
              </div>
              <div className="mt-2 font-[var(--font-noto-serif)] text-[18px] leading-tight uppercase">
                Administração
              </div>
              <div className="mt-2 font-[var(--font-work-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
                Formação intelectual e mentoria.
              </div>
            </div>

            <nav className="px-2 py-2">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "block px-3 py-2",
                    "font-[var(--font-space-grotesk)] text-[11px] uppercase tracking-[0.22em]",
                    "text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]",
                    "border-l-4 border-transparent hover:border-[var(--liceu-accent)] hover:bg-[var(--liceu-surface)]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-2 border-t border-[var(--liceu-stone)] px-4 py-4">
              <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
                responsável
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-3">
                <div className="truncate font-[var(--font-work-sans)] text-[12px] text-[var(--liceu-text)]">
                  {user.email ?? user.id}
                </div>
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em] text-[var(--liceu-muted)] underline underline-offset-4 hover:text-[var(--liceu-text)] bg-transparent border-none p-0 cursor-pointer"
                  >
                    Sair
                  </button>
                </form>
              </div>
            </div>
          </aside>

          <section className="border border-[var(--liceu-stone)] bg-[var(--liceu-bg)]">
            {children}
          </section>
        </div>
      </div>
    </div>
  );
}
