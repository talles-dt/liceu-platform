import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabaseServer";
import { assertAdmin } from "@/lib/admin/auth";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

const NAV = [
  { href: "/admin" as const, label: "command" },
  { href: "/admin/students" as const, label: "students" },
  { href: "/admin/students/create" as const, label: "create" },
  { href: "/admin/progress" as const, label: "progress" },
  { href: "/admin/assignments" as const, label: "assignments" },
  { href: "/admin/mentorship" as const, label: "mentorship" },
  { href: "/admin/content" as const, label: "content" },
  { href: "/admin/system" as const, label: "system" },
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Try admin check; if it fails but user is authenticated, try to sync profile
  let admin = await assertAdmin();
  if (!admin) {
    // Attempt to create the user profile in public.users (for env-admin emails)
    // Then retry the admin check
    const adminClient = createSupabaseAdminClient(); // Local import from the top
    const { data: existing } = await adminClient
      .from("users")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    if (!existing) {
      // User is authenticated in auth.users but missing from public.users
      // Auto-create the profile
      const envAdmins = (process.env.ADMIN_EMAILS ?? "")
        .split(/[,;\s]+/)
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s.length > 0 && s.includes("@"));
      const isAdminEmail = user.email ? envAdmins.includes(user.email.toLowerCase()) : false;

      const { error: insertError } = await adminClient.from("users").insert({
        id: user.id,
        name:
          (user.user_metadata?.full_name as string) ||
          (user.user_metadata?.name as string) ||
          user.email?.split("@")[0] ||
          "User",
        email: user.email,
        role: isAdminEmail ? "admin" : "student",
      });

      if (insertError) {
        console.error("[admin/layout] Failed to auto-create user profile:", insertError.message);
      } else {
        // Retry admin assertion
        admin = await assertAdmin();
      }
    }
  }

  // Final check
  if (!admin) {
    redirect("/");
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
                Command center
              </div>
              <div className="mt-2 font-[var(--font-work-sans)] text-[11px] leading-relaxed text-[var(--liceu-muted)]">
                Severe. Precise. Analytical.
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
                operator
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
                    logout
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
