import {getStripeClient} from "@/lib/stripe";
import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/supabaseServer";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {sameOrigin,uuid} from "@/lib/formation/server";
export async function POST(request:Request,{params}:{params:Promise<{orderId:string}>}){
 if(!sameOrigin(request))return NextResponse.json({error:"Forbidden"},{status:403});const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {orderId}=await params;if(!uuid(orderId))return NextResponse.json({error:"Invalid order"},{status:400});const db=createSupabaseAdminClient();
 const {data:o,error}=await db.from("liceu_service_orders").select("status,stripe_session_id").eq("id",orderId).eq("user_id",user.id).maybeSingle();
 if(error)return NextResponse.json({error:"Consulta indisponível"},{status:503});if(!o)return NextResponse.json({error:"Not found"},{status:404});
 if(["cancelled","refund_requested","refund_pending","refunded"].includes(o.status))return NextResponse.json({message:"Pedido já registrado."});
 if(!["requested","offered","paid"].includes(o.status))return NextResponse.json({error:"Pedido já entregue; solicite atendimento."},{status:409});
 if(o.status==="offered"&&o.stripe_session_id){try{const stripe=getStripeClient(),session=await stripe.checkout.sessions.retrieve(o.stripe_session_id);if(session.status==="complete")return NextResponse.json({error:"Pagamento em conciliação. Aguarde a atualização antes de solicitar reembolso."},{status:409});if(session.status==="open")await stripe.checkout.sessions.expire(session.id);}catch{return NextResponse.json({error:"Não foi possível encerrar o checkout. Nenhum cancelamento foi confirmado."},{status:503});}}
 const {data:saved,error:saveError}=await db.from("liceu_service_orders").update({status:o.status==="paid"?"refund_requested":"cancelled",updated_at:new Date().toISOString()}).eq("id",orderId).eq("status",o.status).select("id");
 if(saveError||!saved?.length)return NextResponse.json({error:"Pedido alterado. Atualize antes de tentar novamente."},{status:409});
 return NextResponse.json({message:o.status==="paid"?"Solicitação registrada. O reembolso será analisado; nenhum valor foi devolvido ainda.":"Solicitação cancelada."});
}
