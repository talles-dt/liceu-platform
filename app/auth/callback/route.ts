"use server";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

const DEFAULT_REDIRECT_ROOT = process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_ENV === "production" ? "https://www.oliceu.com" : "http://localhost:3000");

function getRedirectRoot(requestUrl: string): string {
  return DEFAULT_REDIRECT_ROOT;
}

function createHtmlRedirect(url: string): NextResponse {
  console.log("[auth/callback] Redirecting to:", url);
  return new NextResponse(
    `<html><head>
      <meta http-equiv="refresh" content="0; url=${url}">
      <script>window.location.replace("${url}")</script>
    </head><body>Redirecting...</body></html>`,
    { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' } }
  );
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const requestUrl = request.url;
  const redirectRoot = getRedirectRoot(requestUrl);

  console.log("[auth/callback] Entry", { code, type, requestUrl });

  if (!code) {
    console.error("[auth/callback] Missing code");
    return NextResponse.redirect(`${redirectRoot}/login?error=invalid_link`);
  }

  // Recovery flow: immediate redirect
  if (type === "recovery") {
    const target = `${redirectRoot}/reset-password?code=${encodeURIComponent(code)}`;
    console.log("[auth/callback] Recovery redirect", target);
    return createHtmlRedirect(target);
  }

  // Normal flow: process session then redirect
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data?.user) {
    console.error("[auth/callback] Exchange failed", { error: error?.message });
    return NextResponse.redirect(`${redirectRoot}/login?error=invalid_link`);
  }

  console.log("[auth/callback] Auth success", { user: data.user.id });
  return NextResponse.redirect(`${redirectRoot}/dashboard`);
}