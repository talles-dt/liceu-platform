import {sameOrigin,uuid} from "@/lib/formation/server";
import { NextResponse } from "next/server";
import { currentStaff } from "@/lib/staff";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { getStripeClient } from "@/lib/stripe";
export async function PATCH(request:Request,{params}:{params:Promise<{orderId:string}>}){
 if(!sameOrigin(request))return NextResponse.json({error:"Forbidden"},{status:403});
 const staff=await currentStaff();if(!staff)return NextResponse.json({error:"Forbidden"},{status:403});
 const {orderId}=await params;const b=await request.json().catch(()=>null);const db=createSupabaseAdminClient(staff.user.id);
 const {data:order,error}=await db.from("liceu_service_orders").select("*").eq("id",orderId).maybeSingle();
 if(error||!order)return NextResponse.json({error:"Not found"},{status:404});
 if(order.teacher_id!==staff.user.id && staff.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
 if(b?.action==="assign"){
  if(staff.role!=="admin"||order.status!=="requested"||!uuid(b.teacherId))return NextResponse.json({error:"Atribuição inválida"},{status:403});
  const {data:teacher}=await db.from("users").select("role,suspended_at").eq("id",b.teacherId).maybeSingle();
  if(!teacher||teacher.suspended_at||!["admin","teacher"].includes(teacher.role))return NextResponse.json({error:"Docente indisponível"},{status:400});
  const {error}=await db.from("liceu_service_orders").update({teacher_id:b.teacherId}).eq("id",orderId).eq("status","requested");
  return error?NextResponse.json({error:"Falha ao atribuir"},{status:503}):NextResponse.json({success:true});
 }
 let update:Record<string,unknown>;
 if(b?.action==="offer" && order.status==="requested"){
  const due=Date.parse(b.dueAt);
  if(typeof b.scope!=="string" || b.scope.length<20 || b.scope.length>3000 || !Number.isFinite(due) || due<=Date.now())return NextResponse.json({error:"Informe escopo e prazo/disponibilidade futuros."},{status:400});
  const priceId=order.kind==="review"?process.env.STRIPE_REVIEW_PRICE_ID:process.env.STRIPE_MENTORING_PRICE_ID;
  if(!priceId)return NextResponse.json({error:"Preço não configurado."},{status:503});
  const price=await getStripeClient().prices.retrieve(priceId);
  if(!price.active || price.type!=="one_time")return NextResponse.json({error:"Preço avulso inválido."},{status:503});
  if(order.kind==="mentoring" && (!Number.isInteger(b.durationMinutes)||b.durationMinutes<15||b.durationMinutes>180))return NextResponse.json({error:"Informe a duração da sessão (15–180 min)."},{status:400});
  update={status:"offered",teacher_id:order.teacher_id??staff.user.id,scope:b.scope,due_at:new Date(due).toISOString(),duration_minutes:order.kind==="mentoring"?b.durationMinutes:null,price_id:priceId};
 }else if(b?.action==="complete" && order.status==="paid"){
  if(typeof b.feedback!=="string"||b.feedback.length<20||b.feedback.length>20000)return NextResponse.json({error:"Informe o feedback (20–20.000 caracteres)."},{status:400});
  const criteria=["clarity","argument","audience"];
  if(order.kind==="review"&&(!b.rubric||!criteria.every(k=>typeof b.rubric[k]==="string"&&b.rubric[k].trim().length>=10&&b.rubric[k].length<=4000)))return NextResponse.json({error:"Registre evidências nos três critérios da revisão."},{status:400});
  update={status:"completed",feedback:b.feedback,rubric:order.kind==="review"?{version:"course-review-1",observations:b.rubric}:null};
 }else return NextResponse.json({error:"Transição inválida."},{status:409});
 const {data:saved,error:saveError}=await db.from("liceu_service_orders").update({...update,updated_at:new Date().toISOString()}).eq("id",orderId).eq("status",order.status).select("id");
 if(saveError||!saved?.length)return NextResponse.json({error:"O pedido mudou. Atualize a página."},{status:409});
 return NextResponse.json({success:true});
}
