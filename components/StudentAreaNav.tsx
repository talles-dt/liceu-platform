import Link from 'next/link';
export function StudentAreaNav({area}:{area:'formation'|'mentoring'|'common'}) {
 return <nav aria-label="Áreas do aluno" className="flex flex-wrap gap-5 border-b border-[var(--liceu-stone)] pb-4">
 <Link href="/dashboard?areas=1">Meus espaços</Link>
 <Link href="/formacoes" aria-current={area==='formation'?'page':undefined}>Formação</Link>
 <Link href="/aluno/mentoria" aria-current={area==='mentoring'?'page':undefined}>Mentoria</Link>
 <Link href="/conta">Conta e cobrança</Link><Link href="/me">Perfil e histórico</Link>
 </nav>;
}
