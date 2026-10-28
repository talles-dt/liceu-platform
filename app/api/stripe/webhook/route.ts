import {NextResponse} from "next/server";
import {getStripeClient} from "@/lib/stripe";
import {processEvent} from "@/lib/operations/events";
export async function POST(req:Request){
 const secret=process.env.STRIPE_WEBHOOK_SECRET;if(!secret)return NextResponse.json({error:"Webhook unavailable"},{status:503});
 let event;
 try{event=getStripeClient().webhooks.constructEvent(await req.text(),req.headers.get("stripe-signature")??"",secret);}catch{return NextResponse.json({error:"Invalid signature"},{status:400});}
 try{await processEvent("stripe",event.id,event);return NextResponse.json({received:true});}
 catch{return NextResponse.json({error:"Retry required; event retained when storage is available."},{status:500});}
}
