import type Stripe from "stripe";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getStripeClient } from "@/lib/stripe";
import { abuseHash } from "./abuse";

/** Fetch current Stripe state; event order is not subscription state order. */
export async function handleSubscriptionEvent(event: Stripe.Event): Promise<boolean> {
  const object=event.data.object;
  let subscriptionId: string | null=null;
  if(object.object==="subscription") subscriptionId=object.id;
  else if(object.object==="invoice") subscriptionId=typeof object.subscription==="string"?object.subscription:object.subscription?.id??null;
  else if(object.object==="checkout.session" && object.mode==="subscription") subscriptionId=typeof object.subscription==="string"?object.subscription:object.subscription?.id??null;
  if(!subscriptionId)return false;
  const stripe=getStripeClient();
  const sub=await stripe.subscriptions.retrieve(subscriptionId,{expand:["default_payment_method","latest_invoice"]});
  const userId=sub.metadata.liceu_user_id;
  if(!userId)return false; // Legacy products remain on the historical handler.
  const db=createSupabaseAdminClient();
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
    if(["past_due","canceled"].includes(sub.status)){
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
}

export async function handleServiceEvent(event: Stripe.Event): Promise<boolean>{
 const session=event.data.object;
 if(session.object!=="checkout.session" || !session.metadata?.liceu_order_id)return false;
 if(!["checkout.session.completed","checkout.session.async_payment_succeeded"].includes(event.type)||session.payment_status!=="paid")return true;
 const db=createSupabaseAdminClient();
 const {data:order,error}=await db.from("liceu_service_orders").select("user_id,status,stripe_session_id,price_id").eq("id",session.metadata.liceu_order_id).single();
 if(error||order.user_id!==session.metadata.liceu_user_id)throw new Error("Order ownership mismatch");
 if(order.stripe_session_id===session.id && ["paid","completed"].includes(order.status))return true;
 if(order.status!=="offered")throw new Error("Order no longer payable; reconcile payment");
 const items=await getStripeClient().checkout.sessions.listLineItems(session.id);
 if(items.data.length!==1 || items.data[0].price?.id!==order.price_id || items.data[0].quantity!==1)throw new Error("Order price mismatch");
 const {error:saveError}=await db.from("liceu_service_orders").update({status:"paid",stripe_session_id:session.id,updated_at:new Date().toISOString()}).eq("id",session.metadata.liceu_order_id).eq("status","offered");
 if(saveError)throw saveError;
 return true;
}
