import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { syncUserProfile } from "@/lib/users";
import { isAdminEmail } from "@/lib/users";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.oliceu.com";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code || "");

  if (error || !data?.user) {
    console.error("[auth/callback] Exchange failed", error?.message);
    return NextResponse.redirect(`${SITE_URL}/login?error=invalid_link`);
  }

  // Sync user to public.users table (creates if missing, auto-sets admin role for env-listed admins)
  try {
    await syncUserProfile(data.user, { autoAdmin: isAdminEmail(data.user.email) });
  } catch (err) {
    console.error("[auth/callback] Failed to sync user profile:", err instanceof Error ? err.message : String(err));
    // Continue anyway — don't fail login just because sync failed
  }

  if (next?.startsWith("/") && !next.startsWith("//")) {
    return NextResponse.redirect(`${SITE_URL}${next}`);
  }

  if (type === "recovery") {
    return NextResponse.redirect(`${SITE_URL}/reset-password`);
  }

  return NextResponse.redirect(`${SITE_URL}/dashboard`);
}
