import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getStripeClient } from "@/lib/stripe";
export async function POST(request:Request,{params}:{params:Promise<{orderId:string}>}){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const origin=process.env.NEXT_PUBLIC_SITE_URL && new URL(process.env.NEXT_PUBLIC_SITE_URL).origin;
 if(process.env.STRIPE_SALES_ENABLED!=="true"||!origin)return NextResponse.json({error:"Vendas ainda não abertas."},{status:503});
 if(request.headers.get("origin")!==origin)return NextResponse.json({error:"Forbidden"},{status:403});
 const {orderId}=await params;const db=createSupabaseAdminClient();
 const {data:order,error}=await db.from("liceu_service_orders").select("*").eq("id",orderId).eq("user_id",user.id).single();
 if(error||!order||order.status!=="offered"||!order.price_id||!order.teacher_id||Date.parse(order.due_at)<=Date.now())return NextResponse.json({error:"Oferta indisponível ou expirada."},{status:409});
 const stripe=getStripeClient();
 const price=await stripe.prices.retrieve(order.price_id);
 if(!price.active||price.type!=="one_time")return NextResponse.json({error:"Preço indisponível."},{status:409});
 const session=await stripe.checkout.sessions.create({mode:"payment",line_items:[{price:order.price_id,quantity:1}],customer_email:user.email,
  metadata:{liceu_order_id:order.id,liceu_user_id:user.id,purchase_kind:order.kind},
  success_url:`${origin}/servicos?payment=success`,cancel_url:`${origin}/servicos`,
  custom_text:{submit:{message:`${order.scope.slice(0,800)}. ${order.kind==="review"?"Prazo":"Sessão prevista"}: ${new Date(order.due_at).toLocaleDateString("pt-BR")}.`}},
 },{idempotencyKey:`liceu-service-${order.id}`});
 if(!session.url)return NextResponse.json({error:"Checkout indisponível"},{status:503});
 const saved=await db.from("liceu_service_orders").update({stripe_session_id:session.id}).eq("id",order.id).eq("status","offered").select("id");
 if(saved.error||!saved.data?.length){await stripe.checkout.sessions.expire(session.id);return NextResponse.json({error:"Oferta alterada. Atualize a página."},{status:409});}
 return NextResponse.json({url:session.url});
}
