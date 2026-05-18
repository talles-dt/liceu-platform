"use server";

import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.oliceu.com";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  console.log("[auth/callback] Entry", { code, type, next });

  // Recovery flow: bypass Supabase OTP, force password reset via Admin API
  if (type === "recovery" && code) {
    const supabaseAdmin = createSupabaseAdminClient();
    const { data: { user }, error } = await supabaseAdmin.auth.admin.updateUserById(code, {
      password: "temp123456", // Temp password — user must reset
      user_metadata: { recovery: true }
    });

    if (error || !user) {
      console.error("[auth/callback] Recovery failed", error?.message);
      return NextResponse.redirect(`${SITE_URL}/login?error=invalid_recovery`);
    }

    console.log("[auth/callback] Recovery success", user.id);
    return NextResponse.redirect(`${SITE_URL}/reset-password?token=${encodeURIComponent(code)}`);
  }

  // Normal flow: exchange code for session
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code || "");

  if (error || !data?.user) {
    console.error("[auth/callback] Exchange failed", error?.message);
    return NextResponse.redirect(`${SITE_URL}/login?error=invalid_link`);
  }

  console.log("[auth/callback] Auth success", data.user.id);
  const redirectUrl = next ? `${SITE_URL}${next}` : `${SITE_URL}/dashboard`;
  return NextResponse.redirect(redirectUrl);
}