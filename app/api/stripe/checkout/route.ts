import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { billingConfig } from "@/lib/billing/config";
import { allowCheckout } from "@/lib/billing/abuse";

export async function POST(request: Request) {
  const user=await getCurrentUser();
  if(!user) return NextResponse.json({error:"Entre na sua conta para assinar."},{status:401});
  if(!user.email_confirmed_at) return NextResponse.json({error:"Confirme seu email antes de iniciar o teste."},{status:403});
  const body=await request.json().catch(()=>null);
  if(body?.kind!=="subscription" || body?.consent!==true) return NextResponse.json({error:"Confirme os termos da assinatura mensal."},{status:400});
  let lockHeld=false;
  const db=createSupabaseAdminClient();
  try {
    const {origin,priceId}=billingConfig();
    if(request.headers.get("origin")!==origin) return NextResponse.json({error:"Origem inválida."},{status:403});
    if(!await allowCheckout(request,user.id)) return NextResponse.json({error:"Muitas tentativas nesta rede ou conta. Aguarde ou entre em contato para revisão."},{status:429});
    const {data:profile,error:profileError}=await db.from("users").select("suspended_at").eq("id",user.id).maybeSingle();
    if(profileError || !profile || profile.suspended_at) return NextResponse.json({error:"Conta indisponível."},{status:403});
    const {data:locked,error:lockError}=await db.rpc("liceu_lock_checkout",{p_user:user.id});
    if(lockError) throw new Error("Checkout lock unavailable");
    if(!locked)return NextResponse.json({error:"Uma contratação já está sendo preparada. Aguarde."},{status:409});
    lockHeld=true;
    const stripe=getStripeClient();
    const price=await stripe.prices.retrieve(priceId);
    if(!price.active || price.type!=="recurring" || price.recurring?.interval!=="month" || price.recurring.interval_count!==1)
      throw new Error("A configuração do plano mensal precisa ser revisada.");
    const {error:insertError}=await db.from("liceu_billing_accounts").upsert({user_id:user.id},{onConflict:"user_id",ignoreDuplicates:true});
    if(insertError) throw new Error("Não foi possível preparar a conta.");
    const {data:account,error}=await db.from("liceu_billing_accounts").select("customer_id,trial_used_at,checkout_session_id").eq("user_id",user.id).single();
    if(error) throw new Error("Não foi possível consultar a conta.");
    if(account.checkout_session_id){
      const pending=await stripe.checkout.sessions.retrieve(account.checkout_session_id);
      if(pending.status==="open" && pending.url)return NextResponse.json({url:pending.url});
    }
    let customerId=account.customer_id as string | null;
    if(!customerId){
      const customer=await stripe.customers.create({email:user.email,metadata:{liceu_user_id:user.id}},{idempotencyKey:`liceu-customer-${user.id}`});
      customerId=customer.id;
      const {error:saveError}=await db.from("liceu_billing_accounts").update({customer_id:customerId}).eq("user_id",user.id);
      if(saveError) throw new Error("Não foi possível vincular a conta.");
    }
    const existing=await stripe.subscriptions.list({customer:customerId,status:"all",limit:100});
    if(existing.data.some(s=>!["canceled","incomplete_expired"].includes(s.status))) return NextResponse.json({error:"Você já tem uma assinatura. Gerencie-a em Minha conta."},{status:409});
    const eligible=!account.trial_used_at && !existing.data.some(s=>s.trial_start!==null);
    const session=await stripe.checkout.sessions.create({
      mode:"subscription",customer:customerId,payment_method_types:["card"],payment_method_collection:"always",
      line_items:[{price:priceId,quantity:1}],client_reference_id:user.id,
      subscription_data:{metadata:{liceu_user_id:user.id},...(eligible?{trial_period_days:14}:{} )},
      metadata:{liceu_user_id:user.id,purchase_kind:"subscription"},
      success_url:`${origin}/conta?checkout=success`,cancel_url:`${origin}/conta?checkout=cancelled`,
      expires_at:Math.floor(Date.now()/1000)+1800,
      custom_text:{submit:{message:eligible?"14 dias grátis. Depois, cobrança mensal automática no valor exibido. Cancele em Minha conta antes do fim do teste para não ser cobrado.":"Assinatura mensal. Esta conta já utilizou o teste grátis; a cobrança começa agora."}},
    },{idempotencyKey:`liceu-checkout-${user.id}-${Math.floor(Date.now()/1000/1800)}`});
    const {error:sessionError}=await db.from("liceu_billing_accounts").update({checkout_session_id:session.id}).eq("user_id",user.id);
    if(sessionError)throw new Error("Checkout persistence failed");
    return NextResponse.json({url:session.url});
  } catch(error) {
    console.error("[billing/checkout]",error instanceof Error?error.message:"failure");
    return NextResponse.json({error:"Assinatura indisponível no momento. Consulte Minha conta antes de tentar novamente."},{status:503});
  } finally {
    if(lockHeld) await db.from("liceu_billing_accounts").update({checkout_lock_until:null}).eq("user_id",user.id);
  }
}
