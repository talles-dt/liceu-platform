import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { assertAdmin } from "@/lib/admin/auth";
import { randomBytes } from "crypto";

/**
 * Generate a secure random password
 */
function generateSecurePassword(): string {
  return randomBytes(16).toString("base64").slice(0, 24);
}

/**
 * POST /api/admin/students
 *
 * Create a student manually (for migration, deals, gifts).
 * Body: { email: string, name?: string, password?: string }
 *
 * If password is omitted, a secure random password is generated and returned.
 * The admin should share this password with the student.
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
  const password = body.password?.trim() ?? generateSecurePassword();

  try {
    // Check if email already exists to provide better error message
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === email,
    );

    if (emailExists) {
      return NextResponse.json(
        { error: "Email already exists. Use a different email or update the existing user." },
        { status: 400 },
      );
    }

    // Create user with explicit password (always confirmed)
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, full_name: name },
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

    // Only return password if it was auto-generated (not provided by admin)
    const shouldReturnPassword = !body.password?.trim();

    return NextResponse.json({
      id: userId,
      email,
      name,
      created: true,
      method: "password",
      ...(shouldReturnPassword && { generatedPassword: password }),
      message: shouldReturnPassword
        ? "Student created. Share the generated password with them."
        : "Student created successfully.",
    });
  } catch (e) {
    console.error("[admin/students] unexpected error", e);
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 },
    );
  }
}
