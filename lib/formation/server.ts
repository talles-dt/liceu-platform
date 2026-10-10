import { NextResponse } from "next/server";
import { createSupabaseServerClient, getCurrentUser } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
export const uuid = (value:unknown): value is string => typeof value==="string" && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value);
export function sameOrigin(request:Request) {
 const expected=new URL(request.url).origin;
 const configured=process.env.NEXT_PUBLIC_SITE_URL;
 return request.headers.get("origin")===(configured?new URL(configured).origin:expected);
}
export async function identity() {
 if(!process.env.NEXT_PUBLIC_SUPABASE_URL)return null;
 const user=await getCurrentUser();if(!user)return null;
 const db=await createSupabaseServerClient();
 const {data,error}=await db.from("users").select("role,suspended_at").eq("id",user.id).maybeSingle();
 if(error||!data||data.suspended_at)return null;
 return {user,db,role:String(data.role)};
}
export function fail(message:string,status=400){return NextResponse.json({error:message},{status,headers:{"Cache-Control":"private, no-store"}});}
export function databaseFailure(error:{code?:string}) {
 const status=error.code==="42501"?403:error.code==="P0002"?404:["40001","23505"].includes(error.code??"")?409:["22023","22P02","23514","23503","23502"].includes(error.code??"")?400:503;
 return fail(status===409?"O registro mudou ou já foi enviado. Atualize antes de tentar novamente.":status===403?"Você não tem acesso a esta ação.":status===400?"Confira os campos e os vínculos com a coorte.":"Não foi possível concluir. Seus dados não foram confirmados como salvos.",status);
}
export async function command(actor:string,cohort:string,action:string,body:Record<string,unknown>){
 return createSupabaseAdminClient().rpc("formation_command",{p_actor:actor,p_cohort:cohort,p_action:action,p_body:body});
}
export const readableTables=["activities","participations","drafts","submissions","performances","reviews","assessments","codex","artifacts","memberships"] as const;
export async function cohortSnapshot(cohortId:string) {
 const auth=await identity();if(!auth)return null;
 const {data:cohort,error}=await auth.db.from("formation_cohorts").select("*").eq("id",cohortId).maybeSingle();
 if(error)throw Error("Banco da formação indisponível");if(!cohort)return null;
 const {data:release,error:releaseError}=await auth.db.from("formation_releases").select("id,version,hash,manifest").eq("id",cohort.release_id).single();
 if(releaseError)throw Error("Release indisponível");
 const tables:Record<string,Record<string,unknown>[]>= {};
 for(const name of readableTables){
  const rows:Record<string,unknown>[]=[];
  for(let from=0;;from+=500){
   const {data,error}=await auth.db.from(`formation_${name}`).select("*").eq("cohort_id",cohortId).range(from,from+499);
   if(error)throw Error("Não foi possível recuperar o portfólio completo");rows.push(...data);if(data.length<500)break;
  }tables[name]=rows;
 }
 const admin=createSupabaseAdminClient();
 const {data:members,error:memberError}=await admin.from("formation_memberships").select("user_id").eq("cohort_id",cohortId);
 if(memberError)throw Error("Participantes indisponíveis");
 const {data:people,error:peopleError}=await admin.from("users").select("id,name").in("id",members.map(m=>m.user_id));
 if(peopleError)throw Error("Participantes indisponíveis");
 const roster=(people??[]).map(p=>({id:String(p.id),name:String(p.name??"Participante")}));
 return {userId:auth.user.id,cohort,release,tables,roster};
}
