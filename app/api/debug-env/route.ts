import { NextResponse } from "next/server";

/**
 * TEMPORARY diagnostic — remove after confirming env vars.
 * Hit /api/debug-env to see which vars are present at runtime.
 */
export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? "SET (" + process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 20) + "...)"
      : "MISSING",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "SET"
      : "MISSING",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? "SET"
      : "MISSING",
    ADMIN_EMAILS: process.env.ADMIN_EMAILS
      ? "SET (" + process.env.ADMIN_EMAILS + ")"
      : "MISSING",
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "SET" : "MISSING",
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });
}
