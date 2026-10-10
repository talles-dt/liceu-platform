import {NextResponse} from "next/server";
import {assertAdmin} from "@/lib/admin/auth";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {sameOrigin,uuid} from "@/lib/formation/server";
type Context={params:Promise<{moduleId:string}>};
const view=(q:Record<string,unknown>)=>({id:q.id,prompt:q.question,options:q.options,correct_option_id:q.correct_answer,order_index:q.order_index});
export async function GET(_r:Request,{params}:Context){
 if(!await assertAdmin())return NextResponse.json({error:"Forbidden"},{status:403});const {moduleId}=await params;if(!uuid(moduleId))return NextResponse.json({error:"Invalid module"},{status:400});
 const {data,error}=await createSupabaseAdminClient().from("liceu_quiz_questions").select("id,question,options,correct_answer,order_index").eq("module_id",moduleId).eq("is_published",true).order("order_index");
 return error?NextResponse.json({error:"Não foi possível carregar o quiz"},{status:503}):NextResponse.json({questions:(data??[]).map(view)});
}
export async function POST(req:Request,{params}:Context){
 if(!sameOrigin(req)||!await assertAdmin())return NextResponse.json({error:"Forbidden"},{status:403});const {moduleId}=await params;const b=await req.json().catch(()=>null);
 if(!uuid(moduleId)||typeof b?.prompt!=="string"||!b.prompt.trim()||b.prompt.length>5000||!Array.isArray(b.options)||b.options.length<2||b.options.length>10||!b.options.every((o:{id?:unknown;label?:unknown})=>typeof o?.id==="string"&&typeof o.label==="string"&&o.label.length>0&&o.label.length<=2000)||new Set(b.options.map((o:{id:string})=>o.id)).size!==b.options.length||!b.options.some((o:{id:string})=>o.id===b.correct_option_id))return NextResponse.json({error:"Questão e alternativas inválidas"},{status:400});
 const {data,error}=await createSupabaseAdminClient().from("liceu_quiz_questions").insert({module_id:moduleId,question:b.prompt,options:b.options,correct_answer:b.correct_option_id,is_published:true}).select("id,question,options,correct_answer,order_index").single();
 return error?NextResponse.json({error:"Não foi possível salvar"},{status:503}):NextResponse.json({question:view(data)});
}
export async function DELETE(req:Request,{params}:Context){
 if(!sameOrigin(req)||!await assertAdmin())return NextResponse.json({error:"Forbidden"},{status:403});const {moduleId}=await params;const b=await req.json().catch(()=>null);if(!uuid(moduleId)||!uuid(b?.question_id))return NextResponse.json({error:"Invalid question"},{status:400});
 const {error}=await createSupabaseAdminClient().from("liceu_quiz_questions").update({is_published:false}).eq("module_id",moduleId).eq("id",b.question_id);
 return error?NextResponse.json({error:"Não foi possível retirar a questão"},{status:503}):NextResponse.json({ok:true});
}
