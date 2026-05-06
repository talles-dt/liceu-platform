import { createClient } from '@supabase/supabase-js';
import type { Database } from "@/lib/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createSupabaseBrowserClient() {
 if (!supabaseUrl || !supabaseKey) {
 throw new Error('Missing Supabase environment variables');
 }
 
 return createClient<Database>(supabaseUrl, supabaseKey);
}