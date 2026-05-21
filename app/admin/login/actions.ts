"use server";

import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminEmail } from "@/lib/users";

/** Shape must match what useFormState expects: (prevState, formData) => nextState */
export type AdminLoginState = { error: string } | null;

const ADMIN_REDIRECT = "/admin";
const LOGIN_ERROR_MSG = "Email ou senha incorretos.";
const ACCESS_DENIED_MSG = "Acesso restrito. Apenas administradores.";

/**
 * Server action: authenticates admin via email/password, verifies admin status.
 * Does NOT redirect — returns an error state instead so useFormState can display it.
 * Redirect is handled client-side after a successful state is received.
 */
export async function adminLoginAction(
  prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email e senha são obrigatórios." };
  }

  const supabase = await createSupabaseServerClient();

  // Sign in — cookie is set server-side automatically
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (signInError) {
    return { error: LOGIN_ERROR_MSG };
  }

  // Get the session to check email
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return { error: "Sessão não criada. Tente novamente." };
  }

  // Verify admin status via ADMIN_EMAILS env var
  if (!isAdminEmail(session.user.email)) {
    // Not an admin — sign out and show error
    await supabase.auth.signOut();
    return { error: ACCESS_DENIED_MSG };
  }

  // Admin confirmed — return success state (client redirects on success state)
  return null;
}

/**
 * After a successful admin login (null state returned), call this to get the redirect URL.
 * In practice the client just checks: state === null && !prevState means success.
 * We expose this as a separate function for use in the redirect check.
 */
export async function getAdminRedirectUrl(): Promise<string> {
  return ADMIN_REDIRECT;
}