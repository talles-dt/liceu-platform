import Link from 'next/link';
import {redirect} from 'next/navigation';
import {studentContext} from '@/lib/studentAreasServer';
import {studentHome} from '@/lib/studentAreas';
import {StudentAreaNav} from '@/components/StudentAreaNav';
export const dynamic="force-dynamic";
export default async function DashboardPage({searchParams}:{searchParams:Promise<{areas?:string}>}) {
 const context=await studentContext();if(!context)redirect('/login');
 const home=studentHome(context.access);if(home&&(await searchParams).areas!=='1')redirect(home);
 return <main className="max-w-5xl mx-auto p-6 md:p-10 space-y-8"><StudentAreaNav area="common"/><h1 className="text-4xl font-serif">Meus espaços</h1><p>Uma conta, percursos com acompanhamento próprio.</p><div className="grid md:grid-cols-2 gap-6">
 <section className="border p-6 space-y-4"><h2 className="text-2xl">Formação</h2><p>Coorte, leituras, encontros e portfólio de gramática, lógica e retórica.</p><Link className="underline" href={context.access.formation?'/formacoes':'/formacoes/curriculo'}>{context.access.formation?'Entrar na Formação':'Conhecer a Formação'}</Link></section>
 <section className="border p-6 space-y-4"><h2 className="text-2xl">Mentoria</h2><p>Objetivos individuais, sessões e devolutivas do professor.</p><Link className="underline" href={context.access.mentoring?'/aluno/mentoria':'/servicos'}>{context.access.mentoring?'Entrar na Mentoria':'Solicitar acompanhamento'}</Link></section></div>
 <Link href="/estudos" className="block underline">Biblioteca de módulos e estudos da assinatura</Link></main>;
}
