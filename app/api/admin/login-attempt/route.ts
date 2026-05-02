import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

interface RequestBody {
  email: string;
  success: boolean;
}

export async function POST(request: Request) {
  try {
    const { email, success }: RequestBody = await request.json();
    const ip = headers().get("x-forwarded-for") || "unknown";
    const userAgent = headers().get("user-agent") || "unknown";
    
    // Validate input
    if (!email || !email.includes("@") || email.length < 5) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }
    
    const cleanEmail = email.toLowerCase().trim();
    const adminEmails = (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map(e => e.toLowerCase().trim())
      .filter(e => e.includes("@"));
    
    // Always console.log for development visibility
    console.log("[ADMIN_LOGIN_ATTEMPT]", {
      email: cleanEmail,
      timestamp: new Date().toISOString(),
      ip,
      userAgent,
      success,
      isAdmin: adminEmails.includes(cleanEmail)
    });
    
    // Only insert to DB if configured
    if (adminEmails.length > 0) {
      try {
        const supabase = createSupabaseAdminClient();
        await supabase.from("admin_login_attempts").insert({
          email: cleanEmail,
          timestamp: new Date().toISOString(),
          ip,
          user_agent: userAgent,
          success,
          metadata: {
            user_agent: userAgent,
            is_admin: adminEmails.includes(cleanEmail)
          }
        });
      } catch (dbError) {
        // Fail silently - we already have console.log
        console.warn("[ADMIN_LOGIN_ATTEMPT_DB_FAILED]", dbError);
      }
    }
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    // Silent failure - logging shouldn't break login
    console.error("[ADMIN_LOGIN_ATTEMPT_ERROR]", error);
    return NextResponse.json(
      { ok: true },
      { status: 200 }
    );
  }
}