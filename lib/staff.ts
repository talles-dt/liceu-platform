import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
export async function currentStaff(){
 const user=await getCurrentUser();if(!user)return null;
 const {data,error}=await createSupabaseAdminClient().from("users").select("role,suspended_at").eq("id",user.id).maybeSingle();
 return !error && data && !data.suspended_at && ["teacher","admin"].includes(data.role)?{user,role:data.role as "teacher"|"admin"}:null;
}
