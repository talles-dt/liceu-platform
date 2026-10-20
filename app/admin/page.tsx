import Link from 'next/link';
import {getAdminSnapshot,adminCount} from '@/lib/admin/queries';
import {MetricBlock} from '@/components/admin/MetricBlock';
export default async function AdminPage(){
 const s=await getAdminSnapshot();
 const [submissions,performances,assessments]=await Promise.all(['formation_submissions','formation_performances','formation_assessments'].map(adminCount));
 const available=s.students.filter(u=>!u.suspended_at);
 return <div className="p-6 space-y-6"><header><h1 className="text-2xl font-serif">Administração do Liceu</h1><p>Formação intelectual, mentoria e acompanhamento dos alunos.</p></header>
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
 <MetricBlock label="Alunos cadastrados" value={s.students.length} note={`${s.students.filter(u=>u.suspended_at).length} contas suspensas. Administradores não entram nesta contagem.`}/>
 <MetricBlock label="Acesso à Formação" value={available.filter(u=>u.formation).length} note="Alunos únicos com matrícula ativa ou concluída; inclui acesso de consulta ao arquivo."/>
 <MetricBlock label="Acesso à Mentoria" value={available.filter(u=>u.mentoring).length} note="Concessão manual válida ou serviço pago/concluído. Um aluno pode ter os dois acessos."/>
 </div>
 <div className="grid gap-5 md:grid-cols-2">
 <section className="border p-5 space-y-3"><h2 className="text-xl font-serif">Formação intelectual</h2><p>{s.cohorts.length} coortes · {s.releases.length} edições curriculares publicadas</p><p>{submissions??'Indisponível'} versões de entregas · {performances??'Indisponível'} registros de performance · {assessments??'Indisponível'} avaliações registradas</p><p className="text-sm">Registros de trabalho e acompanhamento, sem inferência automática de domínio.</p><Link className="underline" href="/admin/formations">Coortes, currículo e materiais</Link></section>
 <section className="border p-5 space-y-3"><h2 className="text-xl font-serif">Mentoria</h2><p>{s.orders.filter(o=>o.kind==='mentoring'&&o.status==='paid').length} serviços de mentoria pagos · {s.orders.filter(o=>o.kind==='mentoring'&&o.status==='completed').length} concluídos</p><p className="text-sm">Serviços e concessões administrativas são fontes distintas de acesso.</p><Link className="underline" href="/admin/mentorship">Candidaturas e agendamentos</Link></section>
 </div>
 <nav className="flex flex-wrap gap-5"><Link className="underline" href="/admin/students">Alunos e acessos</Link><Link className="underline" href="/admin/students/create">Criar aluno</Link><Link className="underline" href="/admin/progress">Acompanhamento</Link><Link className="underline" href="/admin/system">Registros administrativos</Link></nav>
 </div>;
}
