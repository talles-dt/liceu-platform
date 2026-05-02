"use server"

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { email } = await request.json();
    const ip = headers().get("x-forwarded-for") || "unknown";
    const userAgent = headers().get("user-agent") || "unknown";
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    // Basic email validation to prevent spam
    if (!email.includes("@") || email.length < 5) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }
    
    // Log to database
    const { error: dbError } = await supabase.from("admin_login_attempts").insert({
      email: email.toLowerCase().trim(),
      timestamp: new Date().toISOString(),
      ip,
      user_agent: userAgent,
      success: false
    }).select("id").single();
    
    // Fallback to server logs if DB fails
    if (dbError) {
      console.error("[ADMIN_LOGIN_ATTEMPT_FAILED]", {
        email,
        ip,
        userAgent,
        error: dbError.message
      });
    } else {
      console.log("[ADMIN_LOGIN_ATTEMPT] logged successfully");
    }
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    console.error("[ADMIN_LOGIN_ATTEMPT_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}