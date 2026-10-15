import {NextResponse} from "next/server";
import {assertAdmin} from "@/lib/admin/auth";
import {sameOrigin,uuid} from "@/lib/formation/server";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {runErasure} from "@/lib/operations/privacy";
export async function POST(req:Request){
 if(!sameOrigin(req))return NextResponse.json({error:"Forbidden"},{status:403});
 const user=await assertAdmin();if(!user)return NextResponse.json({error:"Forbidden"},{status:403});
 const b=await req.json().catch(()=>null);if(!uuid(b?.requestId))return NextResponse.json({error:"Pedido inválido"},{status:400});
 try{
  if(b.action==="approve"){
   if(typeof b.reason!=="string"||b.reason.length<20||b.reason.length>3000||b.sharedReviewed!==true||!Number.isFinite(Date.parse(b.until)))return NextResponse.json({error:"Informe revisão dos registros compartilhados, justificativa e prazo."},{status:400});
   const {error}=await createSupabaseAdminClient(user.id).rpc("liceu_approve_erasure",{p_actor:user.id,p_request:b.requestId,p_reason:b.reason,p_until:b.until,p_reviewed:true});if(error)throw error;
  }else if(b.action==="run")await runErasure(b.requestId,user.id);
  else return NextResponse.json({error:"Ação inválida"},{status:400});
  return NextResponse.json({ok:true});
 }catch{return NextResponse.json({error:"Pedido preservado para retomada. Verifique pendências financeiras, revisão e o último passo registrado."},{status:409});}
}
