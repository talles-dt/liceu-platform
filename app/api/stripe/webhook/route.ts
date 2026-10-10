import {NextResponse} from "next/server";
import {getStripeClient} from "@/lib/stripe";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {handleSubscriptionEvent,handleServiceEvent} from "@/lib/billing/webhook";
export async function POST(req:Request){
 const secret=process.env.STRIPE_WEBHOOK_SECRET;if(!secret)return NextResponse.json({error:"Webhook unavailable"},{status:503});
 const stripe=getStripeClient();let event;
 try{event=stripe.webhooks.constructEvent(await req.text(),req.headers.get("stripe-signature")??"",secret);}catch{return NextResponse.json({error:"Invalid signature"},{status:400});}
 try{
  if(await handleServiceEvent(event)||await handleSubscriptionEvent(event))return NextResponse.json({received:true});
  if(event.type==="checkout.session.completed" && event.data.object.payment_status==="paid"){
   // No ambiguous legacy order-to-course mapping or automatic progress reset.
   const {error}=await createSupabaseAdminClient().from("liceu_legacy_billing_events").upsert({event_id:event.id,event_type:event.type,payload:event.data.object},{onConflict:"event_id",ignoreDuplicates:true});
   if(error)throw error;
  }
  return NextResponse.json({received:true});
 }catch(error){console.error("[stripe/webhook] retry required",error instanceof Error?error.message:"Persistence failed");return NextResponse.json({error:"Retry required"},{status:500});}
}
