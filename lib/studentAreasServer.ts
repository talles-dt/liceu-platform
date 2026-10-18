import { identity } from '@/lib/formation/server';
import { mentoringAccess } from '@/lib/studentAreas';
export async function studentContext() {
  const auth = await identity();
  if (!auth) return null;
  const [memberships, orders, grants] = await Promise.all([
    auth.db.from('formation_memberships').select('cohort_id,role,status').eq('user_id',auth.user.id).in('status',['active','completed']),
    auth.db.from('liceu_service_orders').select('*').eq('user_id',auth.user.id).eq('kind','mentoring').order('created_at',{ascending:false}),
    auth.db.from('access_grants').select('id,metadata,expires_at,revoked_at').eq('user_id',auth.user.id).eq('grant_type','mentorship').eq('source_type','manual_student_creation').is('revoked_at',null),
  ]);
  if (memberships.error || orders.error || grants.error) throw Error('Não foi possível conferir seus acessos. Tente novamente.');
  const manualMentoring=(grants.data??[]).filter(g=>g.metadata?.area==='mentoring'&&(!g.expires_at||new Date(g.expires_at).getTime()>Date.now()));
  return { ...auth, manualMentoring, orders:orders.data ?? [], access:{formation:!!memberships.data?.length,mentoring:manualMentoring.length>0||mentoringAccess(orders.data ?? [])} };
}
