import { createClient } from '@supabase/supabase-js';
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createSupabaseServerClient() {
 if (!supabaseUrl || !supabaseKey) {
 throw new Error('Missing Supabase environment variables');
 }

 const cookieStore = cookies();

 return createClient<Database>(
 supabaseUrl,
 supabaseKey,
 {
 cookies: {
 get(name) {
 return cookieStore.get(name)?.value;
 },
 set(name, value, options) {
 try {
 cookieStore.set({ name, value, ...options });
 } catch (error) {
 // The `set` method was called from a Server Component.
 // This can be ignored if next.js >= 13.4.0 as it sets the cookie automatically.
 }
 },
 remove(name, options) {
 try {
 cookieStore.set({ name, value: '', ...options });
 } catch (error) {
 // The `delete` method was called from a Server Component.
 // This can be ignored if next.js >= 13.4.0 as it deletes the cookie automatically.
 }
 }
 }
 }
 );
}

export async function getCurrentUser() {
 const supabase = createSupabaseServerClient();
 const {
 data: { user },
 error,
 } = await supabase.auth.getUser();
 
 if (!user || error) {
 return null;
 }
 
 return {
 ...user,
 email: user.email?.toLowerCase().trim(),
 };
}