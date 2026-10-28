import {NextResponse} from 'next/server';
import {assertAdmin} from '@/lib/admin/auth';
import {sameOrigin,uuid,fail,databaseFailure} from '@/lib/formation/server';
import {createSupabaseAdminClient} from '@/lib/supabaseAdmin';
export async function PATCH(request:Request,{params}:{params:Promise<{studentId:string}>}){
 if(!sameOrigin(request))return fail('Origem inválida.',403);
 const actor=await assertAdmin();if(!actor)return fail('Acesso administrativo necessário.',403);
 const {studentId}=await params;if(!uuid(studentId))return fail('Aluno inválido.');
 let body;try{body=await request.json();}catch{return fail('Solicitação inválida.');}
 if(!body||typeof body!=='object'||typeof body.reason!=='string'||body.reason.trim().length<5||body.reason.length>1000||!Object.hasOwn(body,'expected'))return fail('Informe o motivo da alteração (5–1.000 caracteres).');
 if(body.action==='formation'){
  if(!uuid(body.cohortId)||!['active','paused','withdrawn','completed'].includes(body.status))return fail('Confira a coorte e a situação da matrícula.');
 }else if(body.action==='mentoring'){
  if(!uuid(body.grantId)||!['save','revoke'].includes(body.mode))return fail('Concessão inválida.');
  if(body.mode==='save'&&(typeof body.scope!=='string'||body.scope.trim().length<20||body.scope.length>3000||(body.expiresAt!==null&&(typeof body.expiresAt!=='string'||!Number.isFinite(Date.parse(body.expiresAt))||Date.parse(body.expiresAt)<=Date.now()))))return fail('Confira o escopo (20–3.000 caracteres) e a validade futura.');
 }else return fail('Ação inválida.');
 const {error}=await createSupabaseAdminClient().rpc('liceu_admin_student_access',{p_actor:actor.id,p_user:studentId,p_body:body});
 if(error)return databaseFailure(error);
 return NextResponse.json({saved:true},{headers:{'Cache-Control':'private, no-store'}});
}
