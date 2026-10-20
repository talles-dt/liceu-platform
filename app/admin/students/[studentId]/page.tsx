import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getAdminSnapshot} from '@/lib/admin/queries';
import {StudentAccessEditor} from '@/components/admin/StudentAccessEditor';
export default async function StudentPage({params}:{params:Promise<{studentId:string}>}){
 const {studentId}=await params;const s=await getAdminSnapshot();const student=s.students.find(u=>u.id===studentId);if(!student)notFound();
 return <div className="p-6 space-y-6"><Link href="/admin/students" className="underline">Voltar aos alunos</Link><header><h1 className="text-2xl font-serif">{student.name||student.email}</h1><p>{student.email}</p><p>Formação: {student.formation?'disponível':'sem acesso'} · Mentoria: {student.mentoring?'disponível':'sem acesso'}{student.suspended_at?' · Conta suspensa — acessos bloqueados':''}</p></header><StudentAccessEditor studentId={studentId} suspended={!!student.suspended_at} members={s.members.filter(m=>m.user_id===studentId)} grants={s.grants.filter(g=>g.user_id===studentId)} orders={s.orders.filter(o=>o.user_id===studentId)} cohorts={s.cohorts}/></div>;
}
