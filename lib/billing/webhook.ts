import {randomUUID} from "node:crypto";
import type Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getStripeClient } from "@/lib/stripe";
import { abuseHash } from "./abuse";

/** Fetch current Stripe state; event order is not subscription state order. */
export async function handleSubscriptionEvent(event: Stripe.Event): Promise<boolean> {
  const object=event.data.object;
  let subscriptionId: string | null=null;
  if(object.object==="subscription") subscriptionId=object.id;
  else if(object.object==="invoice") {
    // Basil and later put the subscription under parent; SDK reads remain pinned to 2024-06-20.
    const invoice=object as Stripe.Invoice & {parent?:{type?:string;subscription_details?:{subscription?:string|{id:string}|null}|null}|null};
    const reference=invoice.subscription??(invoice.parent?.type==="subscription_details"?invoice.parent.subscription_details?.subscription:null);
    subscriptionId=typeof reference==="string"?reference:reference?.id??null;
  }
  else if(object.object==="checkout.session" && object.mode==="subscription") subscriptionId=typeof object.subscription==="string"?object.subscription:object.subscription?.id??null;
  if(!subscriptionId)return false;
  const db=createSupabaseAdminClient(),token=randomUUID();
  const lock=await db.rpc("liceu_lock_billing_entity",{p_entity:subscriptionId,p_token:token});
  if(lock.error||lock.data!==true)throw Error("Subscription processing busy; retry required");
  try {
  const stripe=getStripeClient();
  const sub=await stripe.subscriptions.retrieve(subscriptionId,{expand:["default_payment_method","latest_invoice"]});
  const userId=sub.metadata.liceu_user_id;
  if(!userId)return false; // Legacy products remain on the historical handler.
  const customer=typeof sub.customer==="string"?sub.customer:sub.customer.id;
  const {data:account,error:accountError}=await db.from("liceu_billing_accounts").select("user_id").eq("customer_id",customer).maybeSingle();
  if(accountError || account?.user_id!==userId)throw new Error("Subscription/customer ownership mismatch");
  let status:string=sub.status;
  let until:number|null=null;
  if(sub.status==="trialing") {
    const payment=sub.default_payment_method;
    const fingerprint=payment && typeof payment!=="string"?payment.card?.fingerprint:null;
    if(!fingerprint)throw new Error("Trial card verification pending");
    const {data:allowed,error}=await db.rpc("liceu_claim_trial_card",{p_user:userId,p_hash:abuseHash(fingerprint)});
    if(error)throw error;
    if(!allowed){
      // Stop before the trial can convert into a charge. Shared cards can be reviewed by staff.
      await stripe.subscriptions.cancel(sub.id,{invoice_now:false,prorate:false});
      status="review_required";
    } else until=sub.trial_end;
  } else {
    const invoice=typeof sub.latest_invoice==="object"?sub.latest_invoice:null;
    if(sub.status==="active" && invoice?.status==="paid")until=sub.current_period_end;
    // A failed renewal must not erase the previously paid interval or grant a new one.
    if(["past_due","canceled"].includes(sub.status)||(sub.status==="active"&&invoice?.status!=="paid")){
      const {data:previous,error}=await db.from("liceu_subscriptions").select("access_until").eq("subscription_id",sub.id).maybeSingle();
      if(error)throw error;
      until=previous?.access_until?Math.floor(new Date(previous.access_until).getTime()/1000):null;
    }
  }
  const {error}=await db.rpc("liceu_apply_subscription",{
    p_event:event.id,p_type:event.type,p_created:event.created,p_subscription:sub.id,p_user:userId,p_customer:customer,
    p_status:status,p_until:until?new Date(until*1000).toISOString():null,
    p_trial_end:sub.trial_end?new Date(sub.trial_end*1000).toISOString():null,p_cancel:sub.cancel_at_period_end,
  });
  if(error)throw error;
  return true;
  } finally {
    const released=await db.rpc("liceu_unlock_billing_entity",{p_entity:subscriptionId,p_token:token});
    if(released.error)throw Error("Subscription lock release failed; retry required");
  }
}

export async function handleServiceEvent(event: Stripe.Event): Promise<boolean>{
 const session=event.data.object;
 if(session.object==="refund"&&session.metadata?.liceu_order_id){
  const db=createSupabaseAdminClient();const intent=typeof session.payment_intent==="string"?session.payment_intent:session.payment_intent?.id;
  const {data:o,error}=await db.from("liceu_service_orders").select("payment_intent_id,status").eq("id",session.metadata.liceu_order_id).single();
  if(error||o.payment_intent_id!==intent)throw Error("Refund ownership mismatch");
  if(session.status==="succeeded"&&o.status!=="refunded"){
   const saved=await db.from("liceu_service_orders").update({status:"refunded",refund_id:session.id,updated_at:new Date().toISOString()}).eq("id",session.metadata.liceu_order_id).in("status",["refund_requested","refund_pending"]).select("id");
   if(saved.error||!saved.data?.length)throw Error("Refund state requires reconciliation");
  }
  return true;
 }
 if(session.object!=="checkout.session" || !session.metadata?.liceu_order_id)return false;
 if(!["checkout.session.completed","checkout.session.async_payment_succeeded"].includes(event.type)||session.payment_status!=="paid")return true;
 const db=createSupabaseAdminClient();
 const {data:order,error}=await db.from("liceu_service_orders").select("user_id,status,stripe_session_id,price_id").eq("id",session.metadata.liceu_order_id).single();
 if(error||order.user_id!==session.metadata.liceu_user_id)throw new Error("Order ownership mismatch");
 if(order.stripe_session_id===session.id && ["paid","completed"].includes(order.status))return true;
 if(order.status!=="offered")throw new Error("Order no longer payable; reconcile payment");
 const items=await getStripeClient().checkout.sessions.listLineItems(session.id);
 if(items.data.length!==1 || items.data[0].price?.id!==order.price_id || items.data[0].quantity!==1)throw new Error("Order price mismatch");
 const intent=typeof session.payment_intent==="string"?session.payment_intent:session.payment_intent?.id;
 const {error:saveError}=await db.rpc("liceu_record_service_payment",{p_order:session.metadata.liceu_order_id,p_user:session.metadata.liceu_user_id,p_session:session.id,p_intent:intent??null,p_event:event.id});
 if(saveError)throw saveError;
 return true;
}
