import {NextResponse} from "next/server";
import {assertAdmin} from "@/lib/admin/auth";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
import {sameOrigin,uuid} from "@/lib/formation/server";
type Context={params:Promise<{moduleId:string}>};
export async function GET(_req:Request,{params}:Context){
 const user=await assertAdmin();if(!user)return NextResponse.json({error:"Forbidden"},{status:403});
 const {moduleId}=await params;if(!uuid(moduleId))return NextResponse.json({error:"Invalid module"},{status:400});
 const {data,error}=await createSupabaseAdminClient(user.id).from("liceu_lessons").select("id,title,cloudflare_stream_id,order_index,liceu_theoretical_content(id,title,content_markdown,section_order)").eq("module_id",moduleId).order("order_index");
 return error?NextResponse.json({error:"Consulta indisponível"},{status:503}):NextResponse.json({lessons:data});
}
export async function POST(req:Request,{params}:Context){
 const user=await assertAdmin();if(!sameOrigin(req)||!user)return NextResponse.json({error:"Forbidden"},{status:403});
 const {moduleId}=await params,b=await req.json().catch(()=>null);
 if(!uuid(moduleId)||!uuid(b?.lesson_id))return NextResponse.json({error:"Lição inválida"},{status:400});
 const text=b.content!==undefined,video=b.cloudflare_stream_id!==undefined;
 if(text===video||(text&&(!uuid(b.section_id)||typeof b.content!=="string"||b.content.length>200000))||(video&&(typeof b.cloudflare_stream_id!=="string"||!/^[a-zA-Z0-9_-]{0,100}$/.test(b.cloudflare_stream_id))))return NextResponse.json({error:"Edite uma seção identificada ou o vídeo por vez."},{status:400});
 const db=createSupabaseAdminClient(user.id);
 const lesson=await db.from("liceu_lessons").select("id").eq("id",b.lesson_id).eq("module_id",moduleId).maybeSingle();
 if(lesson.error)return NextResponse.json({error:"Consulta indisponível"},{status:503});if(!lesson.data)return NextResponse.json({error:"Lição não encontrada"},{status:404});
 const result=text?await db.from("liceu_theoretical_content").update({content_markdown:b.content}).eq("id",b.section_id).eq("lesson_id",b.lesson_id).select("id"):await db.from("liceu_lessons").update({cloudflare_stream_id:b.cloudflare_stream_id||null}).eq("id",b.lesson_id).eq("module_id",moduleId).select("id");
 return result.error||!result.data?.length?NextResponse.json({error:"Alteração não salva"},{status:409}):NextResponse.json({ok:true});
}
