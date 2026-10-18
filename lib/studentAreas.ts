export type StudentAreas = { formation: boolean; mentoring: boolean };
export function studentHome(access: StudentAreas): '/formacoes' | '/aluno/mentoria' | null {
  if (access.formation && !access.mentoring) return '/formacoes';
  if (access.mentoring && !access.formation) return '/aluno/mentoria';
  return null;
}
export function mentoringAccess(orders: {kind:string;status:string}[]): boolean {
  return orders.some(o => o.kind === 'mentoring' && ['paid','completed'].includes(o.status));
}
