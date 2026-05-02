import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SafeClient = SupabaseClient<any, string, any>;

type CookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
};

export async function createSupabaseServerClient(): Promise<SafeClient> {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  // Production cookie settings
  const cookieOptions: CookieOptions = {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    domain: process.env.NODE_ENV === "production" 
      ? ".oliceu.com" // Allow subdomains
      : undefined,
    httpOnly: true,
  };

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...cookieOptions, ...options });
        } catch (error) {
          console.error(`[supabaseServer] Failed to set cookie ${name}`, error);
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...cookieOptions, ...options, maxAge: 0 });
        } catch (error) {
          console.error(`[supabaseServer] Failed to remove cookie ${name}`, error);
        }
      },
    },
  }) as SafeClient;
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

