import type Stripe from "stripe";
import {NextResponse} from "next/server";
import {currentStaff} from "@/lib/staff";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {getStripeClient} from "@/lib/stripe";
import {sameOrigin,uuid} from "@/lib/formation/server";
export async function POST(request:Request,{params}:{params:Promise<{orderId:string}>}){
 if(!sameOrigin(request))return NextResponse.json({error:"Forbidden"},{status:403});const staff=await currentStaff();if(staff?.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
 const {orderId}=await params;if(!uuid(orderId))return NextResponse.json({error:"Invalid order"},{status:400});const db=createSupabaseAdminClient();
 const {data:o,error}=await db.from("liceu_service_orders").select("status,payment_intent_id,refund_id").eq("id",orderId).single();
 if(error)return NextResponse.json({error:"Consulta indisponível"},{status:503});if(o.status==="refunded")return NextResponse.json({status:"refunded"});
 if(!["refund_requested","refund_pending"].includes(o.status)||!o.payment_intent_id)return NextResponse.json({error:"Pedido sem solicitação ou pagamento conciliado."},{status:409});
 const pending=await db.from("liceu_service_orders").update({status:"refund_pending",updated_at:new Date().toISOString()}).eq("id",orderId).in("status",["refund_requested","refund_pending"]).select("id");
 if(pending.error||!pending.data?.length)return NextResponse.json({error:"Pedido alterado"},{status:409});
 try{
  const stripe=getStripeClient();
  // Recover a completed provider call even after its idempotency key has expired.
  let existing:Stripe.Refund|null=o.refund_id?await stripe.refunds.retrieve(o.refund_id):null;
  if(!existing){
   for await(const candidate of stripe.refunds.list({payment_intent:o.payment_intent_id,limit:100})){
    if(candidate.metadata?.liceu_order_id===orderId){existing=candidate;break;}
   }
  }
  const refund=existing??await stripe.refunds.create({payment_intent:o.payment_intent_id,metadata:{liceu_order_id:orderId}},{idempotencyKey:`liceu-refund-${orderId}`});
  const status=refund.status==="succeeded"?"refunded":"refund_pending";
  const saved=await db.from("liceu_service_orders").update({status,refund_id:refund.id,updated_at:new Date().toISOString()}).eq("id",orderId).eq("status","refund_pending");
  if(saved.error)throw saved.error;
  if(refund.status==="failed"||refund.status==="canceled")return NextResponse.json({status,error:"O provedor não concluiu o reembolso. Revisão administrativa necessária; nenhuma nova tentativa financeira foi criada."},{status:409});
  return NextResponse.json({status,message:status==="refunded"?"Reembolso confirmado pelo provedor.":"Reembolso ainda pendente de confirmação."});
 }catch{return NextResponse.json({error:"Reembolso pendente de conciliação. Repetir esta ação usa o mesmo pedido, sem criar um segundo reembolso."},{status:503});}
}
