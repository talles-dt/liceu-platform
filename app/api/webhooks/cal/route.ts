import {createHash,createHmac,timingSafeEqual} from "node:crypto";
import {NextResponse} from "next/server";
import {processEvent} from "@/lib/operations/events";
export async function POST(req:Request){
 const secret=process.env.CAL_WEBHOOK_SECRET;if(!secret)return NextResponse.json({error:"Webhook unavailable"},{status:503});
 const body=await req.text();if(body.length>1048576)return NextResponse.json({error:"Payload too large"},{status:413});
 const signature=req.headers.get("x-cal-signature-256")??"";
 if(!/^[a-f0-9]{64}$/i.test(signature)||!timingSafeEqual(Buffer.from(signature,"hex"),createHmac("sha256",secret).update(body).digest()))return NextResponse.json({error:"Invalid signature"},{status:401});
 let event;try{event=JSON.parse(body);}catch{return NextResponse.json({error:"Invalid JSON"},{status:400});}
 if(!event||!["BOOKING_CREATED","BOOKING_RESCHEDULED","BOOKING_CANCELLED","BOOKING_REJECTED"].includes(event.triggerEvent))return NextResponse.json({received:true});
 try{await processEvent("cal",createHash("sha256").update(body).digest("hex"),event);return NextResponse.json({received:true});}
 catch{return NextResponse.json({error:"Booking retained for retry or reconciliation."},{status:500});}
}
