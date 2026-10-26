import { passwordError } from "@/lib/passwordPolicy";
import {sameOrigin,uuid} from '@/lib/formation/server';
import {NextResponse} from 'next/server';
import {createSupabaseAdminClient} from '@/lib/supabaseAdmin';
import {assertAdmin} from '@/lib/admin/auth';
import {randomBytes} from 'node:crypto';
const response=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{'Cache-Control':'private, no-store'}});
export async function GET(){
 const actor=await assertAdmin();if(!actor)return response({error:'Acesso administrativo necessário.'},403);
 const {data,error}=await createSupabaseAdminClient(actor.id).from('formation_cohorts').select('id,title,capacity,status').in('status',['draft','active']).order('title');
 return error?response({error:'Não foi possível carregar as coortes.'},503):response({cohorts:data});
}
export async function POST(req:Request){
 if(!sameOrigin(req))return response({error:'Origem não permitida.'},403);
 const actor=await assertAdmin();if(!actor)return response({error:'Acesso administrativo necessário.'},403);
 const b=await req.json().catch(()=>null);
 if(!b||typeof b!=='object'||!uuid(b.requestId)||typeof b.email!=='string'||!/^\S+@\S+\.\S+$/.test(b.email.trim())||b.email.length>254||!['none','formation','mentoring','both'].includes(b.access)|| (b.name!==undefined&&(typeof b.name!=='string'||b.name.length>160)) || (b.password!==undefined&&(typeof b.password!=='string'||b.password.length>128||(b.password.length>0&&b.password.length<12))))return response({error:'Confira email, nome, senha (mínimo 12 caracteres) e tipo de acesso.'},400);
 if(b.password&&passwordError(b.password))return response({error:passwordError(b.password)},400);
 const formation=['formation','both'].includes(b.access),mentoring=['mentoring','both'].includes(b.access);
 if(formation&&!uuid(b.cohortId))return response({error:'Escolha uma coorte para a Formação.'},400);
 if(mentoring&&(typeof b.scope!=='string'||b.scope.trim().length<20||b.scope.trim().length>3000))return response({error:'Descreva o escopo da Mentoria em 20 a 3.000 caracteres.'},400);
 const expiry=mentoring&&b.expiresAt?new Date(b.expiresAt):null;
 if(expiry&&(!Number.isFinite(expiry.getTime())||expiry.getTime()<=Date.now()))return response({error:'Informe uma validade futura.'},400);
 const choices={access:b.access,cohortId:formation?b.cohortId:null,scope:mentoring?b.scope.trim():'',expiresAt:expiry?.toISOString()??null};
 const email=b.email.trim().toLowerCase(),db=createSupabaseAdminClient(actor.id);
 // Validate cohort before Auth creation; capacity is checked under lock by the RPC.
 if(formation){const {data,error}=await db.from('formation_cohorts').select('id').eq('id',b.cohortId).in('status',['draft','active']).maybeSingle();if(error)return response({error:'Não foi possível conferir a coorte.'},503);if(!data)return response({error:'Coorte indisponível.'},400);}
 let generatedPassword:string|undefined;let accountCreated=false;
 try{
  const existing=await db.auth.admin.getUserById(b.requestId);
  let account=existing.data.user;
  if(existing.error&&existing.error.status!==404)return response({error:'Não foi possível conferir a solicitação. Tente novamente.'},503);
  if(account){
   // JSONB key order is not stable; compare each persisted field instead.
   if(account.email?.toLowerCase()!==email||account.app_metadata.manual_provisioning_by!==actor.id||Object.entries(choices).some(([k,v])=>account?.app_metadata.manual_access?.[k]!==v))return response({error:'Esta solicitação pertence a outro cadastro ou possui opções diferentes.'},409);
  }else{
   const password=b.password||randomBytes(24).toString('base64url')+'A!';
   const created=await db.auth.admin.createUser({id:b.requestId,email,password,email_confirm:true,user_metadata:{name:b.name?.trim()||null},app_metadata:{manual_provisioning_by:actor.id,manual_access:choices}});
   if(created.error)return response({error:'Não foi possível criar a conta. Confira se o email já está cadastrado.'},409);
   account=created.data.user;accountCreated=true;if(!b.password)generatedPassword=password;
  }
  const {error}=await db.rpc('liceu_provision_student',{p_actor:actor.id,p_user:account.id,p_access:choices.access,p_cohort:choices.cohortId,p_scope:choices.scope,p_expires:choices.expiresAt});
  if(error)return response({error:'A conta existe, mas os acessos não foram concluídos. Use “Retomar cadastro”; não crie outra conta. Confira a disponibilidade da coorte.',userId:account.id,partial:true,generatedPassword},503);
  return response({id:account.id,email,created:true,access:choices.access,generatedPassword,message:accountCreated?'Aluno criado com os acessos selecionados.':'Cadastro retomado e acessos confirmados. Se não guardou a senha, use a recuperação de senha.'});
 }catch{return response({error:'Não foi possível confirmar a conclusão. Retome a mesma solicitação para evitar duplicação.',partial:true,generatedPassword},503);}
}
