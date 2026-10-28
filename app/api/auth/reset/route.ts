"use server";

import { passwordError } from "@/lib/passwordPolicy";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabaseServer";

export async function POST(request: Request) {
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ success: false, error: "Solicitação inválida." }, { status: 400 });
  }
  const password = body?.password;
  const strengthError = passwordError(password);
  if (strengthError) return NextResponse.json({ success: false, error: strengthError }, { status: 400 });
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { success: false, error: "Link de recuperação inválido ou expirado." },
      { status: 403 },
    );
  }

  // Update password for the authenticated recovery session.
  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 403 },
    );
  }

  return NextResponse.json({ success: true });
}
