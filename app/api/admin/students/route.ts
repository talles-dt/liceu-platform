import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { assertAdmin } from "@/lib/admin/auth";

/**
 * POST /api/admin/students
 *
 * Create a student manually (for migration, deals, gifts).
 * Body: { email: string, name?: string, password?: string }
 *
 * If password is omitted, Supabase sends a magic link / invite email.
 */
export async function POST(req: Request) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createSupabaseAdminClient();
  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    name?: string;
    password?: string;
  };

  if (!body.email?.trim()) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const email = body.email.trim().toLowerCase();
  const name = body.name?.trim() ?? null;
  const password = body.password?.trim() ?? null;

  try {
    // Create auth user
    const authPayload: {
      email: string;
      password?: string;
      email_confirm: boolean;
      user_metadata?: { name: string | null };
    } = {
      email,
      email_confirm: true,
      user_metadata: { name },
    };

    if (password) {
      authPayload.password = password;
    }

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        ...authPayload,
        ...(password ? {} : {}),
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 },
      );
    }

    const userId = authData.user.id;

    // Create or update users table row
    const { error: dbError } = await supabase
      .from("users")
      .upsert({
        id: userId,
        email,
        name,
        role: "student",
      });

    if (dbError) {
      console.error("[admin/students] db upsert failed", dbError);
    }

    return NextResponse.json({
      id: userId,
      email,
      name,
      created: true,
    });
  } catch (e) {
    console.error("[admin/students] unexpected error", e);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 },
    );
  }
}
