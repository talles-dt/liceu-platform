import { NextResponse } from "next/server";
import { headers } from "next/headers";

interface RequestBody {
  email: string;
  success?: boolean;
}

export async function POST(request: Request) {
  try {
    const { email, success = false }: RequestBody = await request.json();
    const ip = headers().get("x-forwarded-for") || "unknown";
    const userAgent = headers().get("user-agent") || "unknown";
    
    // Validate input
    if (!email || !email.includes("@") || email.length < 5) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }
    
    // Log to server console (fallback to monitoring)
    console.log("[ADMIN_LOGIN_ATTEMPT]", {
      email: email.toLowerCase().trim(),
      timestamp: new Date().toISOString(),
      ip,
      userAgent,
      success,
    });
    
    return NextResponse.json({ ok: true });
    
  } catch (error) {
    // Silent failure - logging shouldn't break login
    console.error("[ADMIN_LOGIN_ATTEMPT_ERROR]", error);
    return NextResponse.json(
      { ok: true }, // Return success even if logging fails
      { status: 200 }
    );
  }
}