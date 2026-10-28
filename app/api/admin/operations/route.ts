import {NextResponse} from "next/server";
import {assertAdmin} from "@/lib/admin/auth";
import {sameOrigin,uuid} from "@/lib/formation/server";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {processEvent} from "@/lib/operations/events";
export async function POST(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:"Forbidden"},{status:403});
 const user=await assertAdmin();if(!user)return NextResponse.json({error:"Forbidden"},{status:403});
 const b=await req.json().catch(()=>null),db=createSupabaseAdminClient(user.id);
 try{
  if(b?.action==="replay"&&["stripe","cal"].includes(b.provider)&&typeof b.eventId==="string"){
   const {data,error}=await db.from("liceu_webhook_inbox").select("payload").eq("provider",b.provider).eq("event_id",b.eventId).single();
   if(error)throw error;
   await processEvent(b.provider,b.eventId,data.payload);
  }else if(b?.action==="resolve_legacy"&&typeof b.eventId==="string"&&typeof b.email==="string"&&typeof b.reason==="string"&&Number.isFinite(Date.parse(b.until))){
   const {error}=await db.rpc("liceu_resolve_legacy",{p_actor:user.id,p_event:b.eventId,p_email:b.email,p_until:b.until,p_reason:b.reason});if(error)throw error;
  }else if(b?.action==="rectify"&&uuid(b.userId)&&typeof b.name==="string"&&b.name.trim().length>0&&b.name.length<=200){
   const {error}=await db.from("users").update({name:b.name.trim(),updated_at:new Date().toISOString()}).eq("id",b.userId);if(error)throw error;
  }else return NextResponse.json({error:"Operação inválida."},{status:400});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Operação não concluída. Consulte o estado registrado e corrija a causa antes de repetir."},{status:409});}
}
