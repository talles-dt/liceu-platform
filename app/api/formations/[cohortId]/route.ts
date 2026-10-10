import {NextResponse} from "next/server";
import {cohortSnapshot,command,databaseFailure,fail,identity,sameOrigin,uuid} from "@/lib/formation/server";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
type Context={params:Promise<{cohortId:string}>};
export async function GET(_request:Request,{params}:Context){
 const {cohortId}=await params;if(!uuid(cohortId))return fail("Não encontrado",404);
 try{const snapshot=await cohortSnapshot(cohortId);return snapshot?NextResponse.json(snapshot,{headers:{"Cache-Control":"private, no-store"}}):fail("Não encontrado ou sem acesso",404);}catch{return fail("Formação indisponível. Tente novamente.",503);}
}
export async function POST(request:Request,{params}:Context){
 if(!sameOrigin(request))return fail("Origem inválida",403);
 const auth=await identity();if(!auth)return fail("Entre na sua conta",401);
 const {cohortId}=await params;if(!uuid(cohortId))return fail("Coorte inválida");
 const raw=await request.text();if(raw.length>65000)return fail("Conteúdo muito grande",413);
 let b;try{b=JSON.parse(raw);}catch{return fail("JSON inválido");}
 if(!b||typeof b!=="object"||!b.body||typeof b.body!=="object")return fail("Dados inválidos");
 if(b.action==="enroll"){
  if(auth.role!=="admin"||!uuid(b.body.user_id)||!["participant","teacher","evaluator"].includes(b.body.role))return fail("Ação não permitida",403);
  const {error}=await createSupabaseAdminClient().rpc("formation_enroll",{p_admin:auth.user.id,p_cohort:cohortId,p_user:b.body.user_id,p_role:b.body.role});return error?databaseFailure(error):NextResponse.json({saved:true});
 }
 if(!["save_draft","submit","codex","schedule","participation","performance","assign_review","assess","self_review"].includes(b.action))return fail("Ação inválida");
 for(const key of ["id","activity_id","submission_id","performance_id","review_id","reviewer_id","subject_id","user_id"]){if(b.body[key]!==undefined&&b.body[key]!==null&&!uuid(b.body[key]))return fail("Identificador inválido");}
 if(["save_draft","submit"].includes(b.action)&&(!uuid(b.body.activity_id)||!Number.isInteger(b.body.revision)||b.body.revision<0||typeof b.body.body!=="string"))return fail("Rascunho inválido");
 if(b.action==="submit"&&!uuid(b.body.request_id))return fail("Identificador de envio inválido");
 const {data,error}=await command(auth.user.id,cohortId,b.action,b.body);
 return error?databaseFailure(error):NextResponse.json({saved:true,...data});
}
