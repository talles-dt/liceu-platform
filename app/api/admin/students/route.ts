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
    if (password) {
      // Create with explicit password
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name },
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
        method: "password",
      });
    } else {
      // No password — send magic link invite email
      const { data: inviteData, error: inviteError } =
        await supabase.auth.admin.inviteUserByEmail(email, {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.oliceu.com"}/login`,
          data: { name },
        });

      if (inviteError) {
        return NextResponse.json(
          { error: inviteError.message },
          { status: 400 },
        );
      }

      const userId = inviteData.user.id;

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
        method: "invite_email",
        message: "Invite email sent",
      });
    }
  } catch (e) {
    console.error("[admin/students] unexpected error", e);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 },
    );
  }
}
