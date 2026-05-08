import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, number>();

export async function POST(req: Request) {
  let body: { email?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Rate limit: 1 subscription per email per hour
  const now = Date.now();
  const oneHourMs = 60 * 60 * 1000;
  const lastSubmission = rateLimitMap.get(normalizedEmail);

  if (lastSubmission && now - lastSubmission < oneHourMs) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  try {
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from("newsletter_subscribers")
      .upsert(
        {
          email: normalizedEmail,
          subscribed_at: new Date().toISOString(),
          active: true,
        },
        {
          onConflict: "email",
        }
      );

    if (error) {
      console.error("[newsletter] Supabase upsert error:", error);
      return NextResponse.json(
        { error: "Failed to subscribe" },
        { status: 500 }
      );
    }

    // Record rate limit
    rateLimitMap.set(normalizedEmail, now);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[newsletter] Unexpected error:", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
