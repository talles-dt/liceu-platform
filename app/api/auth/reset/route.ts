"use server";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/supabaseServer";

interface ResetRequest {
  code: string;
  password: string;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { code, password } = (await request.json()) as ResetRequest;

  // Validate password strength
  if (password.length < 8) {
    return NextResponse.json(
      { success: false, error: "Senha deve ter no mínimo 8 caracteres." },
      { status: 400 },
    );
  }
  if (!/[A-Z]/.test(password)) {
    return NextResponse.json(
      { success: false, error: "Senha deve conter pelo menos 1 letra maiúscula." },
      { status: 400 },
    );
  }
  if (!/[!@#$%^&*()_+{};':\"\\|,.<>?~-]/.test(password)) {
    return NextResponse.json(
      { success: false, error: "Senha deve conter pelo menos 1 símbolo." },
      { status: 400 },
    );
  }

  // Update password via Supabase
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