import {createSupabaseAdminClient} from '@/lib/supabaseAdmin';
import {assertAdmin} from '@/lib/admin/auth';
import {accessSummary,type Membership,type Grant,type Order} from './access';
export type Cohort={id:string;title:string;status:string;capacity:number;release_id:string};
export type Person={id:string;name:string|null;email:string;role:string;suspended_at:string|null};
export type AdminStudentRow=Person & ReturnType<typeof accessSummary>;
// All pages are read, with stable ordering. A failed query must never become a zero.
export async function adminRows<T>(table:string,columns:string,order='id'):Promise<T[]> {
 const db=createSupabaseAdminClient();const rows:T[]=[];
 for(let from=0;;from+=500){
  let query=db.from(table).select(columns);
  for(const column of order.split(','))query=query.order(column);
  const r=await query.range(from,from+499);
  if(r.error)throw Error(`Não foi possível consultar ${table}.`);
  rows.push(...(r.data as unknown as T[]));if(r.data.length<500)return rows;
 }
}
export async function getAdminSnapshot(){
 const actor=await assertAdmin();
 if(!actor)throw Error('Acesso administrativo necessário.');
 const [users,members,grants,orders,cohorts,releases]=await Promise.all([
  adminRows<Person>('users','id,name,email,role,suspended_at'),
  adminRows<Membership>('formation_memberships','cohort_id,user_id,role,status','cohort_id,user_id'),
  adminRows<Grant>('access_grants','id,user_id,grant_type,source_type,expires_at,revoked_at,updated_at,metadata,modules,courses'),
  adminRows<Order>('liceu_service_orders','id,user_id,kind,status'),
  adminRows<Cohort>('formation_cohorts','id,title,status,capacity,release_id'),
  adminRows<{id:string;version:string}>('formation_releases','id,version'),
 ]);
 const students=users.filter(u=>u.role==='student').map(u=>({...u,...accessSummary(u.id,members,grants,orders)}));
 return {users,students,members,grants,orders,cohorts,releases,currentUserId:actor.id};
}
export async function getAdminStudents(){return (await getAdminSnapshot()).students;}
export async function adminCount(table:string):Promise<number|null>{
 const {count,error}=await createSupabaseAdminClient().from(table).select('*',{count:'exact',head:true});
 return error?null:count;
}
