import Link from "next/link";
import { redirect } from "next/navigation";
import { ReadingLayout } from "@/components/ReadingLayout";
import { BillingActions } from "@/components/BillingActions";
import { getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getStripeClient } from "@/lib/stripe";
import { billingConfig } from "@/lib/billing/config";
export default async function AccountPage(){
 const user=await getCurrentUser();if(!user)redirect("/login");
 const db=createSupabaseAdminClient();
 const [{data:account},{data:subscriptions},{data:review}]=await Promise.all([
  db.from("liceu_billing_accounts").select("customer_id,trial_used_at").eq("user_id",user.id).maybeSingle(),
  db.from("liceu_subscriptions").select("status,access_until,trial_end,cancel_at_period_end").eq("user_id",user.id).order("updated_at",{ascending:false}).limit(1),
  db.from("liceu_trial_reviews").select("status").eq("user_id",user.id).maybeSingle(),
 ]);
 let enabled=false,priceLabel="Preço em configuração";
 try{const {priceId}=billingConfig();const price=await getStripeClient().prices.retrieve(priceId);
  enabled=price.active && price.recurring?.interval==="month" && price.recurring.interval_count===1 && price.unit_amount!==null;
  if(enabled)priceLabel=new Intl.NumberFormat("pt-BR",{style:"currency",currency:price.currency}).format(price.unit_amount!/100)+" / mês";
 }catch{/* Configuration is deliberately closed until the operator sets the offer. */}
 const subscription=subscriptions?.[0];
 return <ReadingLayout eyebrow="LICEU / CONTA" title="Sua assinatura" subtitle="Estudo contínuo, com controle sobre sua cobrança.">
  <div className="space-y-6">
   <p className="text-3xl">{priceLabel}</p>
   <p>14 dias grátis com cartão para contas elegíveis. Depois, assinatura mensal automática. A data e o valor da primeira cobrança aparecem antes da confirmação no checkout.</p>
   <p>Revisões humanas e sessões de mentoria são contratadas separadamente. O avanço nos módulos exige todas as lições e 70% no quiz; não depende de avaliação humana.</p>
   {subscription && <p>Status: {subscription.status}. {subscription.access_until && <>Acesso até {new Date(subscription.access_until).toLocaleDateString("pt-BR")}.</>} {subscription.cancel_at_period_end && "Cancelamento agendado; não haverá renovação."}</p>}
   {review?.status==="pending" && <p role="status">Seu cartão já foi usado em outro teste. A assinatura foi interrompida sem cobrança e encaminhada para revisão.</p>}
   {!enabled && <p role="status">As novas assinaturas ainda não estão abertas.</p>}
   <BillingActions enabled={enabled} customer={!!account?.customer_id} trialEligible={!account?.trial_used_at}/>
   <p>Após o encerramento, seu histórico, suas produções e os feedbacks recebidos continuam disponíveis.</p>
   <Link href="/me" className="underline">Meu histórico e meus dados</Link>
  </div>
 </ReadingLayout>;
}
