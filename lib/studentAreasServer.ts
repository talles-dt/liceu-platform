import { identity } from '@/lib/formation/server';
import { mentoringAccess } from '@/lib/studentAreas';
export async function studentContext() {
  const auth = await identity();
  if (!auth) return null;
  const [memberships, orders] = await Promise.all([
    auth.db.from('formation_memberships').select('cohort_id,role,status').eq('user_id',auth.user.id).in('status',['active','completed']),
    auth.db.from('liceu_service_orders').select('*').eq('user_id',auth.user.id).eq('kind','mentoring').order('created_at',{ascending:false}),
  ]);
  if (memberships.error || orders.error) throw Error('Não foi possível conferir seus acessos. Tente novamente.');
  return { ...auth, orders:orders.data ?? [], access:{formation:!!memberships.data?.length,mentoring:mentoringAccess(orders.data ?? [])} };
}
