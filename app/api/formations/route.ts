import {NextResponse} from "next/server";
import {createHash} from "node:crypto";
import {identity,fail,sameOrigin,databaseFailure,uuid} from "@/lib/formation/server";
import {validateCurriculum} from "@/lib/formation/curriculum";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
export async function GET(){const auth=await identity();if(!auth)return fail("Entre na sua conta",401);const {data,error}=await auth.db.from("formation_cohorts").select("id,title,status");return error?databaseFailure(error):NextResponse.json(data,{headers:{"Cache-Control":"private, no-store"}});}
export async function POST(request:Request){
 if(!sameOrigin(request))return fail("Origem inválida",403);const auth=await identity();if(!auth||auth.role!=="admin")return fail("Administração necessária",403);
 const raw=await request.text();if(raw.length>500000)return fail("Pacote muito grande",413);let b;try{b=JSON.parse(raw);}catch{return fail("JSON inválido");}
 if(!b||typeof b!=="object"||Array.isArray(b))return fail("Dados inválidos");
 const db=createSupabaseAdminClient();
 if(b.action==="publish"){
  try{const manifest=validateCurriculum(b.manifest,true);if(typeof b.source_commit!=="string"||!/^[a-f0-9]{40}$/.test(b.source_commit))return fail("Informe o commit editorial completo");
  const hash=createHash("sha256").update(JSON.stringify(manifest)).digest("hex");const {data,error}=await db.rpc("formation_publish",{p_admin:auth.user.id,p_manifest:manifest,p_hash:hash,p_commit:b.source_commit});return error?databaseFailure(error):NextResponse.json({releaseId:data,hash});
  }catch(e){return fail(e instanceof Error?e.message:"Pacote inválido");}
 }
 if(b.action==="create_cohort"&&uuid(b.release_id)&&uuid(b.teacher_id)&&typeof b.title==="string"&&b.title.trim().length>0&&b.title.length<160){const {data,error}=await db.rpc("formation_create_cohort",{p_admin:auth.user.id,p_release:b.release_id,p_title:b.title,p_teacher:b.teacher_id});return error?databaseFailure(error):NextResponse.json({cohortId:data});}
 return fail("Ação inválida");
}
