import {NextResponse} from "next/server";
import {getCurrentUser} from "@/lib/supabaseServer";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
export async function GET(){
 const user=await getCurrentUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const db=createSupabaseAdminClient();
 const tables=["liceu_learner_progression","liceu_quiz_attempts","liceu_module_completions","liceu_flashcard_progress","liceu_work_versions","liceu_work_drafts","liceu_service_orders","liceu_subscriptions","diagnostic_sessions","assignment_submissions","quiz_attempts","flashcard_progress","purchases","module_progress","mentoring_applications","lesson_progress","mentorship_bookings","mentorship_waitlist","notifications","access_grants","formation_memberships","formation_submissions","formation_drafts","formation_codex","formation_artifacts"];
 const output:Record<string,unknown>={exportedAt:new Date().toISOString(),account:{id:user.id,email:user.email},fileNotice:"Os arquivos binários são baixados separadamente por links autenticados; este JSON contém seus metadados."};
 async function rows(table:string,column:string,values:string[]){const result:Record<string,unknown>[]=[];if(!values.length)return result;for(let index=0;index<values.length;index+=100){for(let offset=0;;offset+=500){const {data,error}=await db.from(table).select("*").in(column,values.slice(index,index+100)).range(offset,offset+499);if(error)throw error;result.push(...data);if(data.length<500)break;}}return result;}
 try{
  for(const table of tables)output[table]=await rows(table,"user_id",[user.id]);
  output.profile=await rows("users","id",[user.id]);
  const reviews=await rows("formation_reviews","subject_id",[user.id]);output.formation_reviews=reviews;
  output.formation_assessments=await rows("formation_assessments","review_id",reviews.map(r=>String(r.id)));
  const memberships=output.formation_memberships as Record<string,unknown>[];
  const cohorts=await rows("formation_cohorts","id",memberships.map(m=>String(m.cohort_id)));output.formation_cohorts=cohorts;
  output.formation_releases=await rows("formation_releases","id",[...new Set(cohorts.map(c=>String(c.release_id)))]);
  const orders=output.liceu_service_orders as Record<string,unknown>[];
  output.liceu_mentoring_bookings=await rows("liceu_mentoring_bookings","order_id",orders.map(o=>String(o.id)));
  const performances:Record<string,unknown>[]=[];
  for(let offset=0;;offset+=500){const {data,error}=await db.from("formation_performances").select("*").contains("participants",[user.id]).order("id").range(offset,offset+499);if(error)throw error;performances.push(...data);if(data.length<500)break;}
  output.formation_performances=performances;
  output.assignment_submissions=(output.assignment_submissions as Record<string,unknown>[]).map(row=>({...row,authenticated_download:row.file_url?`/api/me/assignment-file?id=${row.id}`:null}));
  // Legacy pre-account records are matched only to the verified account email.
  if(user.email){for(const table of ["diagnostic_sessions","mentoring_applications"]){const legacy=await rows(table,"email",[user.email]);const own=output[table] as Record<string,unknown>[];output[table]=[...new Map([...own,...legacy.filter(r=>!r.user_id||r.user_id===user.id)].map(r=>[r.id,r])).values()];}}
 }catch{return NextResponse.json({error:"A exportação ficou incompleta. Nenhum arquivo parcial foi apresentado como completo."},{status:503});}
 return NextResponse.json(output,{headers:{"Cache-Control":"private, no-store","Content-Disposition":"attachment; filename=liceu-meus-dados.json"}});
}
