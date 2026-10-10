import { NextResponse } from "next/server";
import { getCurrentUser,createSupabaseServerClient } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
export async function POST(request:Request){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const b=await request.json().catch(()=>null);
 if(typeof b?.exerciseId!=="string" || typeof b?.content!=="string" || b.content.length>50000)return NextResponse.json({error:"Conteúdo inválido."},{status:400});
 const reader=await createSupabaseServerClient();
 const {data:exercise,error}=await reader.from("liceu_exercises").select("id").eq("id",b.exerciseId).eq("is_published",true).maybeSingle();
 if(error||!exercise)return NextResponse.json({error:"Forbidden"},{status:403});
 const db=createSupabaseAdminClient();
 const result=b.publish===true?await db.from("liceu_work_versions").insert({user_id:user.id,exercise_id:b.exerciseId,content:b.content}).select("id").single()
 :await db.from("liceu_work_drafts").upsert({user_id:user.id,exercise_id:b.exerciseId,content:b.content,updated_at:new Date().toISOString()},{onConflict:"user_id,exercise_id"});
 if(result.error)return NextResponse.json({error:"Não foi possível salvar."},{status:500});
 return NextResponse.json({saved:true,id:result.data?.id});
}
