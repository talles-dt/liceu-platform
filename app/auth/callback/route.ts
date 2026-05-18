"use server";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

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

  if (type === "recovery") {
    return NextResponse.redirect(`${SITE_URL}/reset-password`);
  }

  const redirectUrl = next ? `${SITE_URL}${next}` : `${SITE_URL}/dashboard`;
  return NextResponse.redirect(redirectUrl);
}
