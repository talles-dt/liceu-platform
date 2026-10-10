import {randomUUID} from "node:crypto";
import {NextResponse} from "next/server";
import {identity,uuid,sameOrigin,fail,databaseFailure} from "@/lib/formation/server";
import {createSupabaseAdminClient} from "@/lib/supabaseAdmin";
type Context={params:Promise<{cohortId:string}>};
export async function GET(request:Request,{params}:Context){
 const auth=await identity();if(!auth)return fail("Entre na sua conta",401);const {cohortId}=await params;const id=new URL(request.url).searchParams.get('id');if(!uuid(id)||!uuid(cohortId))return fail("Arquivo inválido");
 const {data,error}=await auth.db.from("formation_artifacts").select("path,state").eq("id",id).eq("cohort_id",cohortId).maybeSingle();if(error)return databaseFailure(error);if(!data||data.state!=="ready")return fail("Não encontrado",404);
 const signed=await createSupabaseAdminClient().storage.from("formation-artifacts").createSignedUrl(data.path,300,{download:true});return signed.error?fail("Download indisponível",503):NextResponse.json({url:signed.data.signedUrl},{headers:{"Cache-Control":"private, no-store"}});
}
export async function POST(request:Request,{params}:Context){
 if(!sameOrigin(request))return fail("Origem inválida",403);const auth=await identity();if(!auth)return fail("Entre na sua conta",401);const {cohortId}=await params;if(!uuid(cohortId))return fail("Coorte inválida");
 const form=await request.formData();const file=form.get("file");const submission=form.get("submission_id");
 if(!(file instanceof File)||!uuid(submission)||file.size===0||file.size>10*1024*1024||!["application/pdf","text/plain"].includes(file.type))return fail("Envie PDF ou texto de até 10 MB");
 const {data:member}=await auth.db.from("formation_memberships").select("status").eq("cohort_id",cohortId).eq("user_id",auth.user.id).maybeSingle();if(member?.status!=="active")return fail("Matrícula ativa necessária",403);
 const {data:work,error}=await auth.db.from("formation_submissions").select("id").eq("id",submission).eq("user_id",auth.user.id).eq("cohort_id",cohortId).maybeSingle();if(error)return databaseFailure(error);if(!work)return fail("Entrega não encontrada",404);
 const bytes=new Uint8Array(await file.arrayBuffer());if(file.type==="application/pdf"&&new TextDecoder().decode(bytes.slice(0,5))!=="%PDF-")return fail("PDF inválido");
 const id=randomUUID(),path=`${cohortId}/${auth.user.id}/${id}.${file.type==="application/pdf"?"pdf":"txt"}`,db=createSupabaseAdminClient();
 const row=await db.from("formation_artifacts").insert({id,cohort_id:cohortId,user_id:auth.user.id,submission_id:submission,path,mime:file.type,bytes:file.size});if(row.error)return databaseFailure(row.error);
 const upload=await db.storage.from("formation-artifacts").upload(path,bytes,{contentType:file.type,upsert:false});if(upload.error)return fail("Upload falhou; a entrega de texto foi preservada.",503);
 const saved=await db.from("formation_artifacts").update({state:"ready"}).eq("id",id);return saved.error?fail("Arquivo pendente de confirmação. Não foi marcado como entregue.",503):NextResponse.json({id,saved:true});
}
