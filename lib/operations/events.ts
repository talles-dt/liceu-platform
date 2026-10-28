import {randomUUID} from "node:crypto";
import type Stripe from "stripe";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {handleServiceEvent,handleSubscriptionEvent} from "@/lib/billing/webhook";

/** Only signature-verified callers or the admin replay route may insert into this inbox. */
export async function processEvent(provider:"stripe"|"cal",id:string,payload:unknown){
 const db=createSupabaseAdminClient(),token=randomUUID();
 const claimed=await db.rpc("liceu_receive_event",{p_provider:provider,p_id:id,p_payload:payload,p_token:token});
 if(claimed.error)throw Error("Inbox unavailable");
 if(claimed.data.state==="done")return;
 if(claimed.data.state!=="claimed")throw Error("Event busy");
 try{
  if(provider==="cal"){
   const applied=await db.rpc("liceu_apply_cal",{p_event:claimed.data.payload});
   if(applied.error)throw Error("Booking requires reconciliation");
  }else{
   const event=claimed.data.payload as Stripe.Event;
   if(!await handleServiceEvent(event)&&!await handleSubscriptionEvent(event)){
    if(event.type==="checkout.session.completed"&&event.data.object.payment_status==="paid"){
     const saved=await db.from("liceu_legacy_billing_events").upsert({event_id:event.id,event_type:event.type,payload:event.data.object},{onConflict:"event_id",ignoreDuplicates:true});
     if(saved.error)throw Error("Legacy ledger unavailable");
    }
   }
  }
  const done=await db.rpc("liceu_finish_event",{p_provider:provider,p_id:id,p_token:token});
  if(done.error||!done.data)throw Error("Inbox acknowledgement failed");
 }catch{
  await db.rpc("liceu_finish_event",{p_provider:provider,p_id:id,p_token:token,p_error:"processing_failed"});
  throw Error("Event retained for retry and administrative reconciliation");
 }
}
