import {readEntry,isEntryKind} from '@/lib/formation/entry';
import {identity,fail,uuid,databaseFailure} from '@/lib/formation/server';
import {canReadMaterial,readModuleMaterial,isModuleKey} from '@/lib/formation/materials';
import {materialResponse} from '@/lib/formation/materialResponse';
import type {Curriculum} from '@/lib/formation/curriculum';
export async function GET(request:Request,{params}:{params:Promise<{cohortId:string}>}){
 const auth=await identity();if(!auth)return fail('Entre na sua conta',401);
 const {cohortId}=await params;if(!uuid(cohortId))return fail('Coorte inválida',404);
 const url=new URL(request.url),kind=url.searchParams.get('kind')??'participant',moduleKey=url.searchParams.get('module')??'c01';
 const entry=url.searchParams.get('entry');
 if(entry&&!isEntryKind(entry))return fail('Suplemento inválido',400);
 if(!isModuleKey(moduleKey))return fail('Módulo inválido',400);
 if(kind!=='participant'&&kind!=='teacher')return fail('Material inválido',400);
 const {data:membership,error}=await auth.db.from('formation_memberships').select('role,status').eq('cohort_id',cohortId).eq('user_id',auth.user.id).maybeSingle();
 if(error)return databaseFailure(error);
 if(!membership||!canReadMaterial(membership.role,membership.status,entry==='teacher'?'teacher':kind))return fail('Material não disponível para este acesso',403);
 const cohort=await auth.db.from('formation_cohorts').select('release_id').eq('id',cohortId).maybeSingle();
 if(cohort.error)return databaseFailure(cohort.error);if(!cohort.data)return fail('Coorte não encontrada',404);
 const release=await auth.db.from('formation_releases').select('manifest').eq('id',cohort.data.release_id).single();
 if(release.error)return databaseFailure(release.error);
 if(entry&&isEntryKind(entry)){
  const manifest=release.data.manifest as Curriculum;
  if(!manifest.entry)return fail('Esta edição não possui caderno de entrada',404);
  if(entry!=='welcome'&&membership.role!=='teacher'){
   const keys=manifest.cycles.flatMap(c=>c.activities).filter(a=>a.type==='baseline').map(a=>a.key);
   if(!keys.length)return fail('Diagnóstico inicial indisponível',409);
   const activities=await auth.db.from('formation_activities').select('id').eq('cohort_id',cohortId).eq('release_id',cohort.data.release_id).in('item_key',keys);
   if(activities.error)return databaseFailure(activities.error);
   const ids=(activities.data??[]).map((a:{id:string})=>a.id);
   if(!ids.length)return fail('Diagnóstico inicial ainda não registrado',409);
   const submitted=await auth.db.from('formation_submissions').select('id').eq('cohort_id',cohortId).eq('user_id',auth.user.id).eq('release_id',cohort.data.release_id).in('activity_id',ids).limit(1).maybeSingle();
   if(submitted.error)return databaseFailure(submitted.error);
   if(!submitted.data){
    const adapted=await auth.db.from('formation_performances').select('id').eq('cohort_id',cohortId).in('activity_id',ids).contains('participants',[auth.user.id]).limit(1).maybeSingle();
    if(adapted.error)return databaseFailure(adapted.error);
    if(!adapted.data)return fail('Entregue primeiro o diagnóstico inicial ou solicite ao professor o registro da realização adaptada.',403);
   }
  }
  try{const text=await readEntry(manifest,entry);return text?materialResponse(text,entry==='teacher'?'teacher':'participant',url.searchParams.get('download')==='1',{entry,version:manifest.entry.version}):fail('Suplemento indisponível',404);}catch{return fail('Não foi possível conferir o suplemento',503);}
 }
 try{const text=await readModuleMaterial(release.data.manifest as Curriculum,kind,moduleKey);if(!text)return fail('Esta edição da coorte não possui este material',404);return materialResponse(text,kind,url.searchParams.get('download')==='1',{moduleKey,version:(release.data.manifest as Curriculum).materials?.[moduleKey]?.version});}catch{return fail('Não foi possível conferir o material',503);}
}
