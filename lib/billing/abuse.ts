import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";

export function abuseHash(value: string) {
  const secret=process.env.TRIAL_HASH_SECRET;
  if (!secret || secret.length<32) throw new Error("Configure TRIAL_HASH_SECRET (32+ caracteres).");
  return createHmac("sha256",secret).update(value).digest("hex");
}
export function trustedIp(request: Request): string | null {
  // Vercel overwrites x-forwarded-for. Never trust it on other hosts by default.
  if (process.env.VERCEL !== "1") return null;
  const ip=request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return ip && isIP(ip) ? ip : null;
}
export async function allowCheckout(request: Request,userId: string) {
  const db=createSupabaseAdminClient();
  const ip=trustedIp(request);
  const keys=[{key:`checkout:user:${userId}`,limit:5,seconds:600}];
  if(ip) keys.push({key:`checkout:ip:${abuseHash(ip)}`,limit:5,seconds:86400});
  for(const item of keys){
    const {data,error}=await db.rpc("liceu_rate_limit",{p_key:item.key,p_limit:item.limit,p_seconds:item.seconds});
    if(error) throw new Error("Não foi possível verificar o limite de tentativas.");
    if(data!==true) return false;
  }
  return true;
}
