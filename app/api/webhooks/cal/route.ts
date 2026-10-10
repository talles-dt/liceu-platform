import { createHmac,timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
export async function POST(req:Request){
 const secret=process.env.CAL_WEBHOOK_SECRET;if(!secret)return NextResponse.json({error:"Webhook unavailable"},{status:503});
 const body=await req.text();const signature=req.headers.get("x-cal-signature-256")??"";
 if(!/^[a-f0-9]{64}$/i.test(signature)||!timingSafeEqual(Buffer.from(signature,"hex"),createHmac("sha256",secret).update(body).digest()))return NextResponse.json({error:"Invalid signature"},{status:401});
 let event;try{event=JSON.parse(body);}catch{return NextResponse.json({error:"Invalid JSON"},{status:400});}
 if(!["BOOKING_CREATED","BOOKING_RESCHEDULED","BOOKING_CANCELLED","BOOKING_REJECTED"].includes(event.triggerEvent))return NextResponse.json({received:true});
 const p=event.payload??event;const orderId=p.metadata?.liceu_order_id;
 if(typeof p.uid!=="string"||typeof orderId!=="string"||!Number.isFinite(Date.parse(p.startTime))||!Number.isFinite(Date.parse(p.endTime)))return NextResponse.json({error:"Missing booking/order details"},{status:400});
 const db=createSupabaseAdminClient();const {data:order,error}=await db.from("liceu_service_orders").select("id,user_id,status,kind").eq("id",orderId).single();
 if(error)return NextResponse.json({error:"Order lookup failed"},{status:500});
 if(order.kind!=="mentoring"||!["paid","completed"].includes(order.status))return NextResponse.json({error:"Paid mentoring order required"},{status:403});
 const {data:owner,error:ownerError}=await db.auth.admin.getUserById(order.user_id);
 if(ownerError)return NextResponse.json({error:"Owner lookup failed"},{status:500});
 if(!Array.isArray(p.attendees)||!p.attendees.some((a:{email?:string})=>a.email?.toLowerCase()===owner.user.email?.toLowerCase()))return NextResponse.json({error:"Attendee mismatch"},{status:403});
 const {error:saveError}=await db.from("liceu_mentoring_bookings").upsert({booking_uid:p.uid,order_id:orderId,start_time:p.startTime,end_time:p.endTime,status:["BOOKING_CANCELLED","BOOKING_REJECTED"].includes(event.triggerEvent)?"cancelled":"scheduled",updated_at:new Date().toISOString()},{onConflict:"booking_uid"});
 return saveError?NextResponse.json({error:"Persistence failed"},{status:500}):NextResponse.json({received:true});
}
