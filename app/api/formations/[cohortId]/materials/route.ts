import {identity,fail,uuid,databaseFailure} from '@/lib/formation/server';
import {canReadMaterial,readModuleMaterial,isModuleKey} from '@/lib/formation/materials';
import {materialResponse} from '@/lib/formation/materialResponse';
import type {Curriculum} from '@/lib/formation/curriculum';
export async function GET(request:Request,{params}:{params:Promise<{cohortId:string}>}){
 const auth=await identity();if(!auth)return fail('Entre na sua conta',401);
 const {cohortId}=await params;if(!uuid(cohortId))return fail('Coorte inválida',404);
 const url=new URL(request.url),kind=url.searchParams.get('kind')??'participant',moduleKey=url.searchParams.get('module')??'c01';
 if(!isModuleKey(moduleKey))return fail('Módulo inválido',400);
 if(kind!=='participant'&&kind!=='teacher')return fail('Material inválido',400);
 const {data:membership,error}=await auth.db.from('formation_memberships').select('role,status').eq('cohort_id',cohortId).eq('user_id',auth.user.id).maybeSingle();
 if(error)return databaseFailure(error);
 if(!membership||!canReadMaterial(membership.role,membership.status,kind))return fail('Material não disponível para este acesso',403);
 const cohort=await auth.db.from('formation_cohorts').select('release_id').eq('id',cohortId).maybeSingle();
 if(cohort.error)return databaseFailure(cohort.error);if(!cohort.data)return fail('Coorte não encontrada',404);
 const release=await auth.db.from('formation_releases').select('manifest').eq('id',cohort.data.release_id).single();
 if(release.error)return databaseFailure(release.error);
 try{const text=await readModuleMaterial(release.data.manifest as Curriculum,kind,moduleKey);if(!text)return fail('Esta edição da coorte não possui este material',404);return materialResponse(text,kind,url.searchParams.get('download')==='1',{moduleKey,version:(release.data.manifest as Curriculum).materials?.[moduleKey]?.version});}catch{return fail('Não foi possível conferir o material',503);}
}
