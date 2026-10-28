import {timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/supabaseServer";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {abuseHash,trustedIp} from "@/lib/billing/abuse";
export const validEmail=(value:unknown):value is string=>typeof value==="string"&&value.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
export async function publicLimit(request:Request,scope:string,recipient:string){
 try{
  const db=createSupabaseAdminClient();const ip=trustedIp(request);
  const keys=[{key:`${scope}:recipient:${abuseHash(recipient.toLowerCase())}`,limit:3}, {key:`${scope}:global`,limit:120}];
  if(ip)keys.push({key:`${scope}:ip:${abuseHash(ip)}`,limit:15});
  for(const item of keys){const {data,error}=await db.rpc("liceu_rate_limit",{p_key:item.key,p_limit:item.limit,p_seconds:3600});if(error)throw error;if(data!==true)return NextResponse.json({error:"Limite de tentativas atingido. Tente mais tarde."},{status:429});}
  return null;
 }catch{return NextResponse.json({error:"Não foi possível verificar a solicitação."},{status:503});}
}
/** A trusted Typebot server or a confirmed account may send to its own address. */
export async function authorizeEmail(request:Request,email:string){
 const configured=process.env.DIAGNOSTIC_WEBHOOK_SECRET;const supplied=request.headers.get("authorization")?.replace(/^Bearer /,"");
 if(configured&&supplied&&Buffer.byteLength(configured)===Buffer.byteLength(supplied)&&timingSafeEqual(Buffer.from(configured),Buffer.from(supplied)))return null;
 const user=await getCurrentUser().catch(()=>null);
 if(!user?.email_confirmed_at||user.email?.toLowerCase()!==email.toLowerCase())return NextResponse.json({error:"Entre com o email confirmado para receber o resultado."},{status:403});
 const expected=new URL(process.env.NEXT_PUBLIC_SITE_URL??request.url).origin;
 return request.headers.get("origin")===expected?null:NextResponse.json({error:"Origem inválida"},{status:403});
}
