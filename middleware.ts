import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "./lib/supabaseServer";
import { getCurrentUser } from "./lib/supabaseServer";

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth/callback|forgot-password|reset-password).*)",
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const supabase = await createSupabaseServerClient();
  
  // --- 1. ADMIN AREA PROTECTION ---
  if (pathname.startsWith("/admin")) {
    // Try to get session from cookies
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    // --- Session Inactivity Timeout: 30 minutes ---
    if (session) {
      const now = Date.now();
      const lastActivity = new Date(session.expires_at).getTime();
      const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
      
      // Force logout if session expired or inactivity timeout reached
      if (now > lastActivity || (lastActivity - now > INACTIVITY_TIMEOUT_MS)) {
        await supabase.auth.signOut();
        const loginUrl = new URL("/login", request.nextUrl);
        loginUrl.searchParams.set("from", pathname);
        loginUrl.searchParams.set("error", "session_expired");
        return NextResponse.redirect(loginUrl);
      }
    }
    
    // --- 2. AUDIT LOGGING ---
    try {
      const ip = request.ip ?? request.headers.get("x-forwarded-for") ?? "unknown";
      const userAgent = request.headers.get("user-agent") ?? "unknown";
      const user = await getCurrentUser();
      
      // Log admin access attempts
      await supabase.from("admin_access_logs").insert({
        path: pathname,
        timestamp: new Date().toISOString(),
        user_id: user?.id ?? null,
        ip,
        user_agent: userAgent,
        action: user ? "access" : "unauthenticated_access",
      });
      
    } catch (error) {
      console.error("[AUDIT_LOG_ERROR]", error);
    }
  }
  
  return NextResponse.next();
}