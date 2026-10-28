import { NextResponse } from "next/server";
import { getCurrentUser,createSupabaseServerClient } from "@/lib/supabaseServer";
import { assertModuleAccess } from "@/lib/routeSecurity";
export async function GET(_req:Request,{params}:{params:Promise<{moduleId:string}>}){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});const {moduleId}=await params;
 const denial=await assertModuleAccess(user.id,moduleId);if(denial)return denial;const db=await createSupabaseServerClient();
 const {data:lessons,error:lessonError}=await db.from("liceu_lessons").select("id").eq("module_id",moduleId).eq("is_published",true);
 if(lessonError)return NextResponse.json({error:"Falha ao carregar lições"},{status:500});
 if(!lessons?.length)return NextResponse.json({setId:moduleId,title:"Revisão do módulo",cards:[]});
 const {data:cards,error}=await db.from("liceu_flashcards").select("id,front,back").in("lesson_id",lessons.map(l=>l.id)).eq("is_published",true).order("id");
 if(error)return NextResponse.json({error:"Falha ao carregar cartões"},{status:500});
 const {data:progress,error:progressError}=await db.from("liceu_flashcard_progress").select("*").eq("user_id",user.id);
 if(progressError)return NextResponse.json({error:"Falha ao carregar progresso"},{status:500});
 const now=Date.now();const due=(cards??[]).flatMap(c=>{const p=progress?.find(p=>p.card_id===c.id);if(p&&Date.parse(p.next_review)>now)return[];return[{...c,easiness:p?.easiness??2.5,intervalDays:p?.interval_days??1,repetitions:p?.repetitions??0,nextReview:p?.next_review??new Date(now).toISOString()}];});
 return NextResponse.json({setId:moduleId,title:"Revisão do módulo",cards:due});
}
