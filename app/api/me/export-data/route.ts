import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/supabaseServer";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
export async function GET(){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const db=createSupabaseAdminClient();
 const tables=["liceu_learner_progression","liceu_quiz_attempts","liceu_module_completions","liceu_flashcard_progress","liceu_work_versions","liceu_work_drafts","liceu_service_orders","liceu_subscriptions","diagnostic_sessions","assignment_submissions","quiz_attempts","flashcard_progress","purchases","module_progress","mentoring_applications"];
 const output:Record<string,unknown>={exportedAt:new Date().toISOString(),account:{id:user.id,email:user.email}};
 for(const table of tables){const rows:unknown[]=[];for(let offset=0;;offset+=500){const {data,error}=await db.from(table).select("*").eq(table==="mentoring_applications"?"email":"user_id",table==="mentoring_applications"?user.email:user.id).range(offset,offset+499);if(error)return NextResponse.json({error:"A exportação ficou incompleta. Tente novamente."},{status:500});rows.push(...data);if(data.length<500)break;}output[table]=rows;}
 return NextResponse.json(output,{headers:{"Cache-Control":"private, no-store","Content-Disposition":"attachment; filename=liceu-meus-dados.json"}});
}
