"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabaseClient";

export default function RecoveryRedirect() {
  const router = useRouter();

  useEffect(() => {
    // 1️⃣ PKCE fallback: URL query params (old flow safety net)
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const token = params.get("token");
    const type = params.get("type");

    if (type === "recovery") {
      if (code) {
        router.replace(`/reset-password?code=${code}`);
        return;
      } else if (token) {
        router.replace(`/reset-password?token=${token}`);
        return;
      }
    }

    // 2️⃣ generateLink flow: listen for PASSWORD_RECOVERY event
    const supabase = createSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.push("/reset-password");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
